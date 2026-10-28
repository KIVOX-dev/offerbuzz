'use client';

import { useState, type InputHTMLAttributes } from 'react';
import { EyeIcon, EyeOffIcon } from './Icons';

/** Password box with a show/hide eye button. */
export function PasswordInput({ className = '', ...rest }: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  const [shown, setShown] = useState(false);
  return (
    <div className="relative">
      <input {...rest} type={shown ? 'text' : 'password'} className={`input pr-12 ${className}`} />
      <button
        type="button"
        onClick={() => setShown((v) => !v)}
        aria-label={shown ? 'Hide password' : 'Show password'}
        aria-pressed={shown}
        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-purple-700 hover:text-purple-900"
      >
        {shown ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}
