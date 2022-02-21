import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { translations } from 'locales/i18n';
import { reactLocalStorage } from 'reactjs-localstorage';
import { useDispatch } from 'react-redux';
import { NotificationSettingsDialog } from 'app/pages/MarginTradePage/components/NotificationSettingsDialog';
import { PairNavbarInfo } from 'app/components/PairNavbarInfo';
import { PairSelect } from './PairSelect';
import { useLocation } from 'react-router-dom';
import imgNotificationBell from 'assets/images/marginTrade/notifications.svg';
import { SpotPairType } from 'app/pages/SpotTradingPage/types';
import { TradingPairType } from 'utils/dictionaries/trading-pair-dictionary';
import { useIsConnected } from 'app/hooks/useAccount';
import { useGetCryptoPairs } from 'app/hooks/trading/useGetCryptoPairs';
import { actions as spotActions } from 'app/pages/SpotTradingPage/slice';
import { actions as marginActions } from 'app/pages/MarginTradePage/slice';
import { usePairList } from 'app/hooks/trading/usePairList';
import { ITradingPairs, TradingType } from 'types/trading-pairs';

interface IPairNavbarProps {
  type: TradingType;
}

export const PairNavbar: React.FC<IPairNavbarProps> = ({ type }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const dispatch = useDispatch();
  const connected = useIsConnected();
  const marginType = useMemo(() => {
    return type === TradingType.MARGIN;
  }, [type]);
  const localStoreObject = !marginType
    ? 'selectedSpotPair'
    : 'selectedMarginPair';
  const selectedPair = reactLocalStorage.getObject(localStoreObject);
  const dispatchAction: any =
    type === TradingType.SPOT ? spotActions : marginActions;
  const tradingType =
    type === TradingType.SPOT ? SpotPairType : TradingPairType;

  const [
    showNotificationSettingsModal,
    setShowNotificationSettingsModal,
  ] = useState(false);

  const storageKey = useMemo(() => {
    switch (location.pathname) {
      case '/spot':
        return 'spot-pairs';
      case '/trade':
        return 'trade-pairs';
      default:
        return '';
    }
  }, [location.pathname]);

  const onNotificationSettingsClick = useCallback(
    () => setShowNotificationSettingsModal(true),
    [],
  );

  const [pair, setPair] = useState<ITradingPairs | undefined>(undefined);

  //getting PAIRS DATA
  const pairsData = useGetCryptoPairs();

  const pairsArray = usePairList(pairsData?.pairs);

  useEffect(() => {
    if (pairsArray && !pair)
      // set SOV_RBTC by default
      for (let item of pairsArray) {
        if (item.trading_pairs === tradingType.SOV_RBTC) {
          setPair([item, item]);
        }
      }
  }, [pairsArray, pair, tradingType.SOV_RBTC]);

  const onPairChange = useCallback(
    pair => {
      setPair(pair);
      if (pair[1] !== pair[0]) {
        reactLocalStorage.setObject(localStoreObject, [
          pair[0].base_symbol,
          pair[1].base_symbol,
        ]);
      }
      //filtering pairs for RBTC as target
      if (pair[0].base_symbol === pair[1].base_symbol && !pair[2]) {
        reactLocalStorage.setObject(localStoreObject, [
          pair[0].base_symbol,
          pair[1].quote_symbol,
        ]);
      }
      //filtering pairs for RBTC as source
      if (pair[0].base_symbol === pair[1].base_symbol && pair[2]) {
        reactLocalStorage.setObject(localStoreObject, [
          pair[0].quote_symbol,
          pair[1].base_symbol,
          pair[2],
        ]);
      }
    },
    [localStoreObject],
  );

  useEffect(() => {
    if (Object.keys(selectedPair).length)
      dispatch(
        dispatchAction.setPairType(
          tradingType[`${selectedPair[0]}_${selectedPair[1]}`],
        ),
      );
  }, [dispatch, selectedPair, tradingType, dispatchAction]);

  return (
    <div className="tw-bg-gray-3 tw-w-full">
      <div className="tw-flex tw-items-center tw-container">
        <PairSelect
          storageKey={storageKey}
          onPairChange={onPairChange}
          pairsData={pairsData}
          type={type}
        />

        {pair && <PairNavbarInfo pair={pair} />}
        {connected && (
          <div>
            <button
              onClick={onNotificationSettingsClick}
              className="tw-text-sm tw-text-primary tw-tracking-normal tw-flex tw-items-center"
              data-action-id="margin-select-asset-enable-notification-button"
            >
              <img
                src={imgNotificationBell}
                alt="Notification bell"
                className="tw-mr-1.5"
              />{' '}
              {t(translations.marginTradePage.notificationsButton.enable)}
            </button>
          </div>
        )}
      </div>

      <NotificationSettingsDialog
        isOpen={showNotificationSettingsModal}
        onClose={() => setShowNotificationSettingsModal(false)}
      />
    </div>
  );
};
