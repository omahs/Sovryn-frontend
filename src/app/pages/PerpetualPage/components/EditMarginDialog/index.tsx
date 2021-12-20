import React, {
  useCallback,
  useMemo,
  useState,
  useEffect,
  useContext,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { translations } from '../../../../../locales/i18n';
import {
  PerpetualPairDictionary,
  PerpetualPairType,
} from '../../../../../utils/dictionaries/perpetual-pair-dictionary';
import { Dialog } from '../../../../containers/Dialog';
import { selectPerpetualPage } from '../../selectors';
import { actions } from '../../slice';
import { isPerpetualTrade, PerpetualPageModals } from '../../types';
import { TradeDetails } from '../TradeDetails';
import { AssetValue } from '../../../../components/AssetValue';
import { AssetValueMode } from '../../../../components/AssetValue/types';
import {
  calculateApproxLiquidationPrice,
  calculateLeverage,
} from '../../utils/perpUtils';
import { fromWei } from 'web3-utils';
import classNames from 'classnames';
import { LeverageViewer } from '../LeverageViewer';
import { toNumberFormat } from '../../../../../utils/display-text/format';
import { AmountInput } from '../../../../components/Form/AmountInput';
import { usePerpetual_accountBalance } from '../../hooks/usePerpetual_accountBalance';
import { calculateMaxMarginWithdrawal } from '../../utils/contractUtils';
import { toWei } from '../../../../../utils/blockchain/math-helpers';
import { PerpetualTxMethods } from '../TradeDialog/types';
import { PerpetualQueriesContext } from '../../contexts/PerpetualQueriesContext';

enum EditMarginDialogMode {
  increase,
  decrease,
}

export const EditMarginDialog: React.FC = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { pairType: currentPairType, modal, modalOptions } = useSelector(
    selectPerpetualPage,
  );

  const {
    ammState,
    traderState,
    perpetualParameters: perpParameters,
  } = useContext(PerpetualQueriesContext);

  const trade = useMemo(
    () => (isPerpetualTrade(modalOptions) ? modalOptions : undefined),
    [modalOptions],
  );
  const pair = useMemo(
    () => trade?.pairType && PerpetualPairDictionary.get(trade.pairType),
    [trade],
  );
  const { available } = usePerpetual_accountBalance(
    trade?.pairType || currentPairType,
  );

  const [mode, setMode] = useState(EditMarginDialogMode.increase);
  const onSelectIncrease = useCallback(
    () => setMode(EditMarginDialogMode.increase),
    [],
  );
  const onSelectDecrease = useCallback(
    () => setMode(EditMarginDialogMode.decrease),
    [],
  );

  const [margin, setMargin] = useState('0');
  const [changedTrade, setChangedTrade] = useState(trade);

  const onClose = useCallback(
    () => dispatch(actions.setModal(PerpetualPageModals.NONE)),
    [dispatch],
  );

  const onSubmit = useCallback(
    () =>
      changedTrade &&
      dispatch(
        actions.setModal(PerpetualPageModals.TRADE_REVIEW, {
          origin: PerpetualPageModals.EDIT_MARGIN,
          trade: changedTrade,
          transactions: [
            mode === EditMarginDialogMode.increase
              ? {
                  pair: pair?.pairType || PerpetualPairType.BTCUSD,
                  method: PerpetualTxMethods.deposit,
                  amount: toWei(margin),
                  approvalTx: null,
                  tx: null,
                  origin: PerpetualPageModals.EDIT_MARGIN,
                }
              : {
                  pair: pair?.pairType || PerpetualPairType.BTCUSD,
                  method: PerpetualTxMethods.withdraw,
                  amount: toWei(margin),
                  tx: null,
                  origin: PerpetualPageModals.EDIT_MARGIN,
                },
          ],
        }),
      ),
    [dispatch, changedTrade, mode, margin, pair],
  );

  const [maxAmount, maxAmountWei] = useMemo(() => {
    if (mode === EditMarginDialogMode.increase) {
      // Fees don't need to be subtracted, since Collateral is not paid with the Network Token
      return [Number(fromWei(available)), available];
    } else {
      const maxAmount = calculateMaxMarginWithdrawal(
        pair,
        traderState,
        ammState,
      );
      return [maxAmount, toWei(maxAmount)];
    }
  }, [mode, available, pair, traderState, ammState]);

  const signedMargin = useMemo(
    () => (mode === EditMarginDialogMode.increase ? 1 : -1) * Number(margin),
    [mode, margin],
  );

  const onChangeMargin = useCallback(
    (value?: string) => {
      const clampedMargin = Math.max(
        0,
        Math.min(maxAmount, value ? Number(value) : Math.abs(signedMargin)),
      );
      setMargin(clampedMargin.toPrecision(8));

      const newMargin = traderState.availableCashCC + signedMargin;
      const leverage = calculateLeverage(
        traderState.marginAccountPositionBC,
        newMargin,
        traderState,
        ammState,
        perpParameters,
      );

      setChangedTrade(
        changedTrade =>
          changedTrade && {
            ...changedTrade,
            leverage,
            margin: toWei(newMargin),
          },
      );
    },
    [signedMargin, maxAmount, traderState, ammState, perpParameters],
  );

  const liquidationPrice = useMemo(
    () =>
      calculateApproxLiquidationPrice(
        traderState,
        ammState,
        perpParameters,
        0,
        signedMargin,
      ),
    [signedMargin, traderState, ammState, perpParameters],
  );

  const isButtonDisabled = useMemo(() => Number(margin) === 0, [margin]);

  useEffect(() => setChangedTrade(trade), [trade]);

  // call onChangeMargin, when it's renewed to enforce maxAmount.
  useEffect(() => onChangeMargin(), [onChangeMargin]);

  return (
    <Dialog
      isOpen={modal === PerpetualPageModals.EDIT_MARGIN}
      onClose={onClose}
    >
      <h1>{t(translations.perpetualPage.editMargin.title)}</h1>
      {trade && pair && (
        <div className="tw-mw-340 tw-mx-auto">
          <TradeDetails
            className="tw-mw-340 tw-mx-auto tw-mb-4"
            trade={trade}
            pair={pair}
          />
          <div className="tw-flex tw-flex-row tw-items-center tw-justify-between tw-mb-5">
            <button
              className={classNames(
                'tw-w-full tw-h-8 tw-font-semibold tw-text-sm tw-rounded-l-lg tw-border tw-border-secondary tw-transition-colors tw-duration-300',
                mode === EditMarginDialogMode.increase
                  ? 'tw-text-white tw-bg-secondary-50'
                  : 'tw-text-gray-5 tw-bg-transparent hover:tw-text-white hover:tw-bg-secondary-50',
              )}
              onClick={onSelectIncrease}
              // disabled={!validate || !connected || openTradesLocked}
            >
              {t(translations.perpetualPage.editMargin.increase)}
            </button>
            <button
              className={classNames(
                'tw-w-full tw-h-8 tw-font-semibold tw-text-sm tw-rounded-r-lg tw-border tw-border-secondary tw-transition-colors tw-duration-300',
                mode === EditMarginDialogMode.decrease
                  ? 'tw-text-white tw-bg-secondary-50'
                  : 'tw-text-gray-5 tw-bg-transparent hover:tw-text-white hover:tw-bg-secondary-50',
              )}
              onClick={onSelectDecrease}
            >
              {t(translations.perpetualPage.editMargin.decrease)}
            </button>
          </div>
          <div className="tw-mb-4 tw-text-sm">
            <label>
              {mode === EditMarginDialogMode.increase
                ? t(translations.perpetualPage.editMargin.increaseLabel)
                : t(translations.perpetualPage.editMargin.decreaseLabel)}
            </label>
            <AmountInput
              value={margin}
              maxAmount={maxAmountWei}
              assetString="BTC"
              decimalPrecision={6}
              step={0.0001}
              onChange={onChangeMargin}
            />
          </div>
          <LeverageViewer
            className="tw-mt-3 tw-mb-4"
            label={t(translations.perpetualPage.tradeForm.labels.leverage)}
            min={pair.config.leverage.min}
            max={pair.config.leverage.max}
            value={changedTrade?.leverage || 0}
            valueLabel={
              changedTrade && `${toNumberFormat(changedTrade.leverage, 2)}x`
            }
          />
          <div className="tw-flex tw-flex-row tw-justify-between tw-px-6 tw-py-1 tw-mb-8 tw-text-xs tw-font-medium tw-border tw-border-gray-5 tw-rounded-lg">
            <label>
              {t(translations.perpetualPage.tradeForm.labels.liquidationPrice)}
            </label>
            <AssetValue
              minDecimals={2}
              maxDecimals={2}
              mode={AssetValueMode.auto}
              value={liquidationPrice}
              assetString={pair.quoteAsset}
            />
          </div>
          <button
            className={classNames(
              'tw-w-full tw-min-h-10 tw-p-2 tw-text-lg tw-text-primary tw-font-medium tw-border tw-border-primary tw-bg-primary-10 tw-rounded-lg tw-transition-colors tw-transition-opacity tw-duration-300',
              isButtonDisabled
                ? 'tw-opacity-25 tw-cursor-not-allowed'
                : 'tw-opacity-100 hover:tw-bg-primary-25',
            )}
            disabled={isButtonDisabled}
            onClick={onSubmit}
          >
            {t(translations.perpetualPage.editMargin.button)}
          </button>
        </div>
      )}
    </Dialog>
  );
};
