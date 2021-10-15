import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectSpotTradingPage } from '../../selectors';
import { BuySell } from '../BuySell';
import { OrderType } from '../OrderType';
import { OrderTypes, pairs, TradingTypes } from '../../types';
import { Asset } from 'types/asset';
import { useHistory, useLocation } from 'react-router-dom';
import { IPromotionLinkState } from 'app/pages/LandingPage/components/Promotions/components/PromotionCard/types';
import { LimitForm } from './LimitForm';
import { MarketForm } from './MarketForm';

export function TradeForm() {
  const [tradeType, setTradeType] = useState(TradingTypes.BUY);
  const [orderType, setOrderType] = useState(OrderTypes.MARKET);

  const [sourceToken, setSourceToken] = useState(Asset.SOV);
  const [targetToken, setTargetToken] = useState(Asset.RBTC);

  const location = useLocation<IPromotionLinkState>();
  const history = useHistory<IPromotionLinkState>();

  const [linkPairType] = useState(location.state?.spotTradingPair);

  const { pairType } = useSelector(selectSpotTradingPage);

  useEffect(() => {
    setSourceToken(
      pairs[linkPairType || pairType][tradeType === TradingTypes.BUY ? 1 : 0],
    );
    setTargetToken(
      pairs[linkPairType || pairType][tradeType === TradingTypes.BUY ? 0 : 1],
    );
  }, [linkPairType, pairType, tradeType]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => linkPairType && history.replace(location.pathname), []);

  return (
    <>
      <div className="tw-trading-form-card spot-form tw-bg-black tw-rounded-3xl tw-p-12 tw-mx-auto xl:tw-mx-0">
        <div className="tw-mw-340 tw-mx-auto">
          <BuySell value={tradeType} onChange={setTradeType} />
          <OrderType value={orderType} onChange={setOrderType} />
          <LimitForm
            sourceToken={sourceToken}
            targetToken={targetToken}
            tradeType={tradeType}
            hidden={orderType !== OrderTypes.LIMIT}
          />
          <MarketForm
            sourceToken={sourceToken}
            targetToken={targetToken}
            tradeType={tradeType}
            hidden={orderType !== OrderTypes.MARKET}
          />
        </div>
      </div>
    </>
  );
}
