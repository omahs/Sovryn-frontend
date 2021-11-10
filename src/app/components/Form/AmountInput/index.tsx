import { bignumber } from 'mathjs';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Asset } from '../../../../types';
import { fromWei } from '../../../../utils/blockchain/math-helpers';
import { AssetRenderer } from '../../AssetRenderer';
import { useAssetBalanceOf } from '../../../hooks/useAssetBalanceOf';
import { Input } from '../Input';
import {
  stringToFixedPrecision,
  toNumberFormat,
} from 'utils/display-text/format';
import { translations } from 'locales/i18n';

interface Props {
  value: string;
  onChange: (value: string, isTotal?: boolean | undefined) => void;
  decimalPrecision?: number;
  asset?: Asset;
  assetString?: string;
  subText?: string;
  placeholder?: string;
  maxAmount?: string;
  readonly?: boolean;
  dataActionId?: string;
  gasFee?: string;
}

export function AmountInput({
  value,
  onChange,
  placeholder = toNumberFormat(0, 6),
  decimalPrecision = 6,
  asset,
  assetString,
  subText,
  maxAmount,
  readonly,
  dataActionId,
  gasFee,
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
            <AssetRenderer asset={asset} assetString={assetString} />
          ) : null
        }
        className="tw-rounded-lg"
        readOnly={readonly}
        dataActionId={dataActionId}
      />
      {subText && (
        <div className="tw-text-xs tw-mt-1 tw-font-thin">{subText}</div>
      )}
      {!readonly && (asset || maxAmount !== undefined) && (
        <AmountSelector
          asset={asset}
          maxAmount={maxAmount}
          gasFee={gasFee}
          onChange={onChange}
        />
      )}
    </>
  );
}

const amounts = [10, 25, 50, 75, 100];

interface AmountSelectorProps {
  asset?: Asset;
  maxAmount?: string;
  gasFee?: string;
  onChange: (value: string, isTotal: boolean) => void;
}

export function AmountSelector(props: AmountSelectorProps) {
  const { t } = useTranslation();
  const { value } = useAssetBalanceOf(props.asset || Asset.RBTC);
  const balance = useMemo(() => {
    if (props.maxAmount !== undefined) {
      return props.maxAmount;
    }
    return value;
  }, [props.maxAmount, value]);

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

    if (
      props.asset === Asset.RBTC &&
      percent === 100 && // remove this to check for selections
      bignumber(value)
        .add(props.gasFee || '0')
        .greaterThan(balance)
    ) {
      value = bignumber(value)
        .minus(props.gasFee || '0')
        .toString();
    }

    props.onChange(fromWei(value), isTotal);
  };
  return (
    <div className="tw-mt-2.5 tw-flex tw-flex-row tw-items-center tw-justify-between tw-border tw-border-secondary tw-rounded-md tw-divide-x tw-divide-secondary">
      {amounts.map(value => (
        <AmountSelectorButton
          key={value}
          text={value === 100 ? t(translations.common.max) : `${value}%`}
          onClick={() => handleChange(value)}
        />
      ))}
    </div>
  );
}

interface AmountButtonProps {
  text?: string;
  onClick?: () => void;
}

export function AmountSelectorButton(props: AmountButtonProps) {
  return (
    <button
      onClick={props.onClick}
      className="tw-text-secondary tw-bg-secondary tw-bg-opacity-0 tw-font-medium tw-text-xs tw-leading-none tw-px-4 tw-py-1 tw-text-center tw-w-full tw-transition hover:tw-bg-opacity-25 focus:tw-bg-opacity-50 tw-uppercase"
      data-action-id={`swap-send-amountSelectorButton-${props.text}`}
    >
      {props.text}
    </button>
  );
}
