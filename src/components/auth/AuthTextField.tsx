import React from 'react';
import { TextField } from '../../ui/components/TextField';

interface AuthTextFieldProps {
  label?: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  helpText?: string;
  required?: boolean;
}

export function AuthTextField({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  disabled,
  error,
  helpText,
  required,
}: AuthTextFieldProps) {
  return (
    <TextField
      label={label}
      disabled={disabled}
      error={error}
      helpText={helpText}
    >
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className="h-full w-full border-none bg-transparent text-body font-body text-default-font outline-none placeholder:text-neutral-400"
      />
    </TextField>
  );
}