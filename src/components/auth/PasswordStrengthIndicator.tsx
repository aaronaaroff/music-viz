import React from 'react';
import { PasswordValidation } from '../../utils/validation';

interface PasswordStrengthIndicatorProps {
  validation: PasswordValidation;
  password: string;
}

export function PasswordStrengthIndicator({ validation, password }: PasswordStrengthIndicatorProps) {
  if (!password) return null;

  const getStrengthColor = () => {
    switch (validation.strength) {
      case 'strong':
        return 'bg-success-600';
      case 'medium':
        return 'bg-warning-600';
      default:
        return 'bg-error-600';
    }
  };

  const getStrengthWidth = () => {
    switch (validation.strength) {
      case 'strong':
        return 'w-full';
      case 'medium':
        return 'w-2/3';
      default:
        return 'w-1/3';
    }
  };

  const getStrengthText = () => {
    switch (validation.strength) {
      case 'strong':
        return 'Strong password';
      case 'medium':
        return 'Medium strength';
      default:
        return 'Weak password';
    }
  };

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1 bg-neutral-200 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-300 ${getStrengthColor()} ${getStrengthWidth()}`}
          />
        </div>
        <span className={`text-caption font-caption ${
          validation.strength === 'strong' ? 'text-success-600' :
          validation.strength === 'medium' ? 'text-warning-600' :
          'text-error-600'
        }`}>
          {getStrengthText()}
        </span>
      </div>
      
      {validation.errors.length > 0 && (
        <ul className="space-y-1">
          {validation.errors.map((error, index) => (
            <li key={index} className="text-caption font-caption text-error-600 flex items-start gap-1">
              <span className="text-error-600 mt-0.5">•</span>
              <span>{error}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}