'use client';

import { type ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-on-primary border-primary-container border-b-4 border-r-4 shadow-md hover:brightness-110',
  secondary: 'bg-secondary text-on-secondary border-gold border-b-4 border-r-4 shadow-md hover:brightness-110',
  tertiary: 'bg-tertiary text-on-tertiary border-tertiary-container border-b-4 border-r-4 shadow-md hover:brightness-110',
  danger: 'bg-error-container text-error border-error border-b-4 border-r-4 shadow-md hover:brightness-110',
  ghost: 'bg-transparent text-on-surface border-outline-variant border-2 hover:bg-surface-high',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        font-display uppercase tracking-wider cursor-pointer
        border-2 transition-transform duration-75
        active:translate-x-[2px] active:translate-y-[2px] active:shadow-none
        disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-x-0 disabled:active:translate-y-0
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
