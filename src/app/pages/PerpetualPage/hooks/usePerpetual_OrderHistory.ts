import { useMemo, useEffect, useContext } from 'react';
import { useAccount } from 'app/hooks/useAccount';
import { TradingPosition } from 'types/trading-position';
import {
  PerpetualTradeType,
  PerpetualTradeEvent,
  PerpetualLiquidationEvent,
  LimitOrderType,
} from '../types';
import {
  Event,
  useGetTraderEvents,
  OrderDirection,
  EventQuery,
} from './graphql/useGetTraderEvents';
import { ABK64x64ToWei } from '../utils/contractUtils';
import { BigNumber } from 'ethers';
import { RecentTradesContext } from '../contexts/RecentTradesContext';
import debounce from 'lodash.debounce';
import { PerpetualPair } from 'utils/models/perpetual-pair';
import { PerpetualPairDictionary } from 'utils/dictionaries/perpetual-pair-dictionary';

// TODO: Finalize this enum once we know what possible order states we can have
enum OrderState {
  Filled = 'Filled',
  Open = 'Open',
  Cancelled = 'Cancelled',
}

export type OrderHistoryEntry = {
  id: string;
  pair?: PerpetualPair;
  datetime: string;
  position?: TradingPosition;
  tradeType: PerpetualTradeType;
  orderState: OrderState;
  orderSize: string;
  triggerPrice?: string;
  limitPrice?: string;
  execPrice?: string;
  orderId?: string;
};

type OrderHistoryHookResult = {
  loading: boolean;
  data?: OrderHistoryEntry[];
  totalCount: number;
};

export const usePerpetual_OrderHistory = (
  page: number,
  perPage: number,
): OrderHistoryHookResult => {
  const account = useAccount();

  const { latestTradeByUser } = useContext(RecentTradesContext);

  // page and per page is not used, as Trade and Liquidate Events are combined into one Paginated Table
  // According to Remy a backend solution is not possible, vasili decided to throw out queried pagination.
  const eventQuery = useMemo(
    (): EventQuery[] => [
      {
        event: Event.TRADE,
        orderBy: 'blockTimestamp',
        orderDirection: OrderDirection.desc,
        page: 1,
        perPage: 1000,
      },
      {
        event: Event.LIQUIDATE,
        orderBy: 'blockTimestamp',
        orderDirection: OrderDirection.desc,
        page: 1,
        perPage: 1000,
      },
      {
        event: Event.LIMIT_ORDER,
        orderBy: 'createdTimestamp',
        orderDirection: OrderDirection.desc,
        page: 1,
        perPage: 1000,
      },
    ],
    [],
  );

  const {
    data: tradeEvents,
    previousData: previousTradeEvents,
    refetch,
    loading,
  } = useGetTraderEvents(account.toLowerCase(), eventQuery);

  const data: OrderHistoryEntry[] = useMemo(() => {
    const currentTradeEvents: PerpetualTradeEvent[] =
      tradeEvents?.trader?.trades || previousTradeEvents?.trader?.trades || [];
    const currentTradeEventsLength = currentTradeEvents.length;

    const currentLiquidationEvents: PerpetualLiquidationEvent[] =
      tradeEvents?.trader?.liquidates ||
      previousTradeEvents?.trader?.liquidates ||
      [];

    const currentLimitOrderEvents: LimitOrderType[] =
      tradeEvents?.trader?.limitOrders ||
      previousTradeEvents?.trader?.limitOrders ||
      [];

    let entries: OrderHistoryEntry[] = [];

    if (currentTradeEventsLength > 0) {
      entries = currentTradeEvents.map(item => {
        const tradeAmount = BigNumber.from(item.tradeAmountBC);
        const tradeAmountWei = ABK64x64ToWei(tradeAmount);
        return {
          id: item.id,
          pair: PerpetualPairDictionary.getById(item?.perpetual?.id),
          datetime: item.blockTimestamp,
          position: tradeAmount.isNegative()
            ? TradingPosition.SHORT
            : TradingPosition.LONG,
          tradeType: PerpetualTradeType.MARKET,
          orderState: OrderState.Filled,
          orderSize: tradeAmountWei,
          limitPrice: ABK64x64ToWei(BigNumber.from(item.limitPrice)),
          execPrice: ABK64x64ToWei(BigNumber.from(item.price)),
          orderId: item.transaction.id,
        };
      });
      const oldestTradeTimestamp = Number(entries[entries.length - 1].datetime);
      entries.push(
        ...currentLiquidationEvents
          .filter(
            liquidation =>
              liquidation &&
              Number(liquidation.blockTimestamp) > oldestTradeTimestamp,
          )
          .map(item => {
            const tradeAmountWei = ABK64x64ToWei(
              BigNumber.from(item.amountLiquidatedBC),
            );
            return {
              id: item.id,
              pair: PerpetualPairDictionary.getById(item?.perpetual?.id),
              datetime: item.blockTimestamp,
              position: undefined,
              tradeType: PerpetualTradeType.LIQUIDATION,
              orderState: OrderState.Filled,
              orderSize: tradeAmountWei,
              limitPrice: undefined,
              execPrice: ABK64x64ToWei(BigNumber.from(item.liquidationPrice)),
              orderId: item.transaction.id,
            };
          }),
      );
      entries.sort((a, b) => Number(b.datetime) - Number(a.datetime));
    }

    if (currentLimitOrderEvents.length > 0) {
      entries.push(
        ...currentLimitOrderEvents.map(item => {
          const tradeAmount = BigNumber.from(item.tradeAmount);
          const tradeAmountWei = ABK64x64ToWei(tradeAmount);
          const triggerPrice = BigNumber.from(item.triggerPrice);
          const triggerPriceWei = ABK64x64ToWei(triggerPrice);
          const limitPrice = ABK64x64ToWei(BigNumber.from(item.limitPrice));

          return {
            id: item.id,
            pair: PerpetualPairDictionary.getById(item?.perpetual?.id),
            datetime: item.createdTimestamp,
            position: tradeAmount.isNegative()
              ? TradingPosition.SHORT
              : TradingPosition.LONG,
            tradeType: triggerPrice.gt(0)
              ? PerpetualTradeType.STOP
              : PerpetualTradeType.LIMIT,
            orderState: getLimitOrderState(item.state),
            triggerPrice: triggerPriceWei,
            orderSize: tradeAmountWei,
            limitPrice: limitPrice,
            execPrice: limitPrice,
            orderId: item.id,
          };
        }),
      );

      entries.sort((a, b) => Number(b.datetime) - Number(a.datetime));
    }

    return entries;
  }, [
    tradeEvents?.trader?.trades,
    tradeEvents?.trader?.liquidates,
    tradeEvents?.trader?.limitOrders,
    previousTradeEvents?.trader?.trades,
    previousTradeEvents?.trader?.liquidates,
    previousTradeEvents?.trader?.limitOrders,
  ]);

  const paginatedData = useMemo(
    () => data && data.slice((page - 1) * perPage, page * perPage),
    [data, page, perPage],
  );

  const refetchDebounced = useMemo(
    () =>
      debounce(refetch, 1000, {
        leading: false,
        trailing: true,
        maxWait: 1000,
      }),
    [refetch],
  );

  useEffect(() => {
    if (latestTradeByUser) {
      refetchDebounced();
    }
  }, [latestTradeByUser, refetchDebounced]);

  return {
    data: paginatedData,
    loading,
    totalCount: data.length,
  };
};

const getLimitOrderState = (state: string): OrderState => {
  switch (state) {
    case 'Active':
      return OrderState.Open;
    case 'Cancelled':
      return OrderState.Cancelled;
    default:
      return OrderState.Filled;
  }
};
