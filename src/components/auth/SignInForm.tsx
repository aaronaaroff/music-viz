import React, { useState } from 'react';
import { Button } from '../../ui/components/Button';
import { AuthTextField } from './AuthTextField';
import { useAuth } from './AuthContext';

interface SignInFormProps {
  onToggleMode: () => void;
  onClose?: () => void;
}

export function SignInForm({ onToggleMode, onClose }: SignInFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please enter your email and password');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        // Handle specific error cases
        if (error.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please try again.');
        } else if (error.message.includes('Email not confirmed')) {
          setError('Please check your email and confirm your account before signing in.');
        } else if (error.message.includes('rate limit')) {
          setError('Too many login attempts. Please try again later.');
        } else if (error.message.includes('Network')) {
          setError('Network error. Please check your connection and try again.');
        } else {
          setError(error.message || 'Failed to sign in. Please try again.');
        }
        setLoading(false);
      } else {
        // Success - the auth context will handle the redirect
        onClose?.();
      }
    } catch (err) {
      console.error('Sign in error:', err);
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-default-background rounded-lg border border-neutral-border">
      <div className="mb-6">
        <h2 className="text-heading-2 font-heading-2 text-default-font mb-2">
          Sign In
        </h2>
        <p className="text-body font-body text-subtext-color">
          Welcome back! Sign in to your account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthTextField
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="Enter your email"
          disabled={loading}
          required
        />

        <div>
          <AuthTextField
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="Enter your password"
            disabled={loading}
            required
          />
          <div className="mt-1 text-right">
            <button
              type="button"
              className="text-caption font-caption text-brand-600 hover:text-brand-700"
              onClick={() => {/* TODO: Implement forgot password */}}
            >
              Forgot password?
            </button>
          </div>
        </div>

        {error && (
          <div className="text-error-700 text-caption font-caption bg-error-50 p-3 rounded-md border border-error-200">
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={loading || !email || !password}
          className="w-full"
          loading={loading}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-caption font-caption text-subtext-color">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={onToggleMode}
            className="text-brand-600 hover:text-brand-700 font-caption-bold"
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
}