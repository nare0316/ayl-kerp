import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  big?: boolean;
}

export function Button({ variant = 'primary', big = false, className = '', ...rest }: Props) {
  return (
    <button
      type="button"
      className={`btn btn-${variant}${big ? ' btn-big' : ''} ${className}`.trim()}
      {...rest}
    />
  );
}
