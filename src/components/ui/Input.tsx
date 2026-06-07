'use client';

import { type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, className = '', id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className={className}>
      {label && (
        <label htmlFor={inputId} className="block font-mono text-xs uppercase tracking-wider text-on-surface-variant mb-1">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className="w-full px-3 py-2 bg-surface-lowest bevel-inset text-on-surface font-body text-sm
          focus:outline-none focus:border-primary placeholder:text-outline"
        {...props}
      />
    </div>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function Textarea({ label, className = '', id, ...props }: TextareaProps) {
  const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className={className}>
      {label && (
        <label htmlFor={textareaId} className="block font-mono text-xs uppercase tracking-wider text-on-surface-variant mb-1">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className="w-full px-3 py-2 bg-surface-lowest bevel-inset text-on-surface font-body text-sm
          resize-none focus:outline-none focus:border-primary placeholder:text-outline"
        rows={3}
        {...props}
      />
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, options, className = '', id, ...props }: SelectProps) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className={className}>
      {label && (
        <label htmlFor={selectId} className="block font-mono text-xs uppercase tracking-wider text-on-surface-variant mb-1">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className="w-full px-3 py-2 bg-surface-lowest bevel-inset text-on-surface font-body text-sm
          focus:outline-none focus:border-primary cursor-pointer"
        {...props}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}
