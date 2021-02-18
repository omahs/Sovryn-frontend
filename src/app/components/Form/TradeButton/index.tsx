import React from 'react';
import cn from 'classnames';
import { Button, ButtonProps } from '../Button';
import { TradingPosition } from '../../../../types/trading-position';

interface Props extends ButtonProps {
  position: TradingPosition;
}

export function TradeButton({ className, position, ...props }: Props) {
  return (
    <Button
      className={cn(
        'tw-btn tw-btn-trade',
        className,
        { 'tw-bg-green': position === TradingPosition.LONG },
        { 'tw-bg-red': position === TradingPosition.SHORT },
      )}
      {...props}
    />
  );
}

TradeButton.defaultProps = {
  type: 'button',
};
