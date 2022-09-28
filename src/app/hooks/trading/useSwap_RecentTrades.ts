import { useEffect, useMemo } from 'react';
import { Asset } from 'types';
import { RecentSwapsDataEntry } from 'types/trading-pairs';
import { LiquidityPoolDictionary } from 'utils/dictionaries/liquidity-pool-dictionary';
import { useGetRecentSwapEventsLazyQuery } from 'utils/graphql/rsk/generated';

export const useSwap_RecentTrades = (baseToken: Asset, quoteToken: Asset) => {
  const pool = useMemo(
    () => LiquidityPoolDictionary.get(baseToken, quoteToken),
    [baseToken, quoteToken],
  );

  const [load, { called, data, loading }] = useGetRecentSwapEventsLazyQuery({
    variables: {
      converterAddress: [pool.converter].map(item => item.toLowerCase()),
      limit: 100,
    },
  });

  useEffect(() => {
    if (pool) {
      load();
    }
  }, [load, pool]);

  return {
    data: (data?.conversions || []) as RecentSwapsDataEntry[],
    loading: called && loading,
  };
};
