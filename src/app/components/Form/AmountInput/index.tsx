import { bignumber } from 'mathjs';
import React, { useMemo } from 'react';
import classNames from 'classnames';

import { Asset } from '../../../../types';
import { fromWei, toWei } from '../../../../utils/blockchain/math-helpers';
import { AssetRenderer } from '../../AssetRenderer';
import { AssetSelect } from 'app/components/AssetSelect';
import { useAssetBalanceOf } from '../../../hooks/useAssetBalanceOf';
import { Input } from '../Input';
import {
  stringToFixedPrecision,
  toNumberFormat,
} from 'utils/display-text/format';

interface Props {
  value: string;
  onChange: (value: string, isTotal?: boolean | undefined) => void;
  decimalPrecision?: number;
  asset?: Asset;
  assetString?: string;
  assetSelectable?: boolean;
  onSelectAsset?: (asset: Asset) => void;
  subText?: string;
  placeholder?: string;
  maxAmount?: string;
  readonly?: boolean;
}

export function AmountInput({
  value,
  onChange,
  placeholder = toNumberFormat(0, 6),
  decimalPrecision = 6,
  asset,
  assetString,
  assetSelectable,
  onSelectAsset,
  subText,
  maxAmount,
  readonly,
}: Props) {
  return (
    <>
      <Input
        value={stringToFixedPrecision(value, decimalPrecision)}
        onChange={onChange}
        type="number"
        placeholder={placeholder}
        appendElem={
          asset || assetString ? (
            assetSelectable ? (
              <AssetSelect
                selected={asset!}
                selectedAssetString={assetString!}
                onChange={onSelectAsset}
              />
            ) : (
              <AssetRenderer asset={asset} assetString={assetString} />
            )
          ) : null
        }
        className="tw-rounded-lg tw-max-w-full"
        appendClassName={assetSelectable ? '' : 'tw-mr-5'}
        readOnly={readonly}
      />
      {subText && (
        <div className="tw-text-xs tw-mt-1 tw-font-thin">{subText}</div>
      )}
      {!readonly && (asset || maxAmount !== undefined) && (
        <AmountSelector
          parentValue={value}
          asset={asset}
          maxAmount={maxAmount}
          onChange={onChange}
        />
      )}
    </>
  );
}

const amounts = [10, 25, 50, 75, 100];

interface AmountSelectorProps {
  parentValue?: string;
  asset?: Asset;
  maxAmount?: string;
  onChange: (value: string, isTotal: boolean) => void;
}

export function AmountSelector(props: AmountSelectorProps) {
  const { value } = useAssetBalanceOf(props.asset || Asset.RBTC);
  const balance = useMemo(() => {
    if (props.maxAmount !== undefined) {
      return props.maxAmount;
    }
    return value;
  }, [props.maxAmount, value]);

  const selectedAmount = useMemo(() => {
    if (!props.parentValue || !balance) return undefined;
    const parentWei = toWei(props.parentValue);
    if (parentWei === balance) return 100;
    const n = parentWei.length;
    return amounts.find(percent => {
      const pAmt = bignumber(balance)
        .mul(percent / 100)
        .round()
        .toString();
      return pAmt.substring(0, n - 1) === parentWei.substring(0, n - 1);
    });
  }, [props.parentValue, balance]);

  const handleChange = (percent: number) => {
    let value = '0';
    let isTotal = false;
    if (percent === 100) {
      value = balance;
      isTotal = true;
    } else if (percent === 0) {
      value = '0';
    } else {
      value = bignumber(balance)
        .mul(percent / 100)
        .toString();
    }
    props.onChange(fromWei(value), isTotal);
  };
  return (
    <div className="tw-mt-2.5 tw-flex tw-flex-row tw-items-center tw-justify-between tw-border tw-border-secondary tw-rounded-md tw-divide-x tw-divide-secondary">
      {amounts.map(value => (
        <AmountSelectorButton
          key={value}
          selected={selectedAmount === value}
          text={`${value}%`}
          onClick={() => handleChange(value)}
        />
      ))}
    </div>
  );
}

interface AmountButtonProps {
  selected?: boolean;
  text?: string;
  onClick?: () => void;
}

export function AmountSelectorButton(props: AmountButtonProps) {
  return (
    <button
      onClick={props.onClick}
      className={classNames(
        'tw-bg-secondary tw-font-medium tw-text-xs tw-leading-none tw-px-4 tw-py-1 tw-text-center tw-w-full tw-transition hover:tw-bg-opacity-25',
        {
          'tw-bg-opacity-0': !props.selected,
          'tw-text-secondary': !props.selected,
          'tw-text-white': props.selected,
        },
      )}
    >
      {props.text}
    </button>
  );
}
