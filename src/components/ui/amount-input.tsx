// src/components/ui/amount-input.tsx
'use client';

import * as React from 'react';
import { Minus, Plus } from 'lucide-react'; // Mengganti ikon agar lebih konsisten

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Omit 'onChange' dari props input asli untuk menghindari konflik
interface AmountInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: number | undefined;
  onValueChange: (value: number | undefined) => void; // Mengganti nama menjadi onValueChange
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
}

const AmountInput = React.forwardRef<HTMLInputElement, AmountInputProps>(
  (
    {
      className,
      value,
      onValueChange, // Menggunakan onValueChange
      min = 0,
      max,
      step = 1000, // Menyesuaikan step default
      disabled,
      ...props
    },
    ref
  ) => {
    const handleIncrement = () => {
      if (disabled) return;
      const newValue = (value ?? 0) + step;
      onValueChange(max !== undefined ? Math.min(newValue, max) : newValue);
    };

    const handleDecrement = () => {
      if (disabled) return;
      const newValue = (value ?? 0) - step;
      onValueChange(Math.max(newValue, min));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;
      const val = e.target.value;
      if (val === '') {
        onValueChange(undefined);
      } else {
        const numVal = parseFloat(val);
        onValueChange(isNaN(numVal) ? undefined : numVal);
      }
    };

    return (
      <div
        className={cn(
          'flex h-9 items-center justify-between rounded-md border border-input bg-transparent shadow-xs focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50',
          disabled && 'cursor-not-allowed opacity-50',
          className
        )}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleDecrement}
          disabled={disabled || (value !== undefined && value <= min)}
          className="h-full rounded-r-none"
        >
          <Minus className="h-4 w-4" />
          <span className="sr-only">Decrease amount</span>
        </Button>
        <Input
          type="number"
          value={value ?? ''}
          onChange={handleChange}
          ref={ref}
          className="h-full w-full border-0 bg-transparent text-center shadow-none focus-visible:ring-0"
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          {...props}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleIncrement}
          disabled={
            disabled ||
            (max !== undefined && value !== undefined && value >= max)
          }
          className="h-full rounded-l-none"
        >
          <Plus className="h-4 w-4" />
          <span className="sr-only">Increase amount</span>
        </Button>
      </div>
    );
  }
);
AmountInput.displayName = 'AmountInput';

export { AmountInput };
