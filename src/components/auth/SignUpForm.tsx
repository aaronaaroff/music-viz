import React, { useState, useEffect } from 'react';
import { Button } from '../../ui/components/Button';
import { AuthTextField } from './AuthTextField';
import { useAuth } from './AuthContext';
import { validatePassword, validateEmail, validateUsername } from '../../utils/validation';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';

interface SignUpFormProps {
  onToggleMode: () => void;
  onClose?: () => void;
}

export function SignUpForm({ onToggleMode, onClose }: SignUpFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState(validatePassword(''));
  const [emailError, setEmailError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  
  const { signUp } = useAuth();

  useEffect(() => {
    if (password) {
      setPasswordValidation(validatePassword(password));
    }
  }, [password]);

  useEffect(() => {
    if (email && !validateEmail(email)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError(null);
    }
  }, [email]);

  useEffect(() => {
    if (username) {
      const validation = validateUsername(username);
      setUsernameError(validation.error || null);
    } else {
      setUsernameError(null);
    }
  }, [username]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    if (!email || !password) {
      setError('Please fill in all required fields');
      return;
    }

    if (emailError) {
      setError(emailError);
      return;
    }

    if (!passwordValidation.isValid) {
      setError('Please fix the password requirements');
      return;
    }

    if (usernameError) {
      setError(usernameError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await signUp(email, password, fullName || undefined, username || undefined);
      
      if (error) {
        // Handle specific Supabase auth errors
        if (error.message.includes('already registered')) {
          setError('An account with this email already exists. Please sign in instead.');
        } else if (error.message.includes('invalid email')) {
          setError('Please enter a valid email address.');
        } else if (error.message.includes('weak password')) {
          setError('Password is too weak. Please choose a stronger password.');
        } else if (error.message.includes('rate limit')) {
          setError('Too many attempts. Please try again later.');
        } else {
          setError(error.message || 'Failed to create account. Please try again.');
        }
        setLoading(false);
      } else {
        setSuccess(true);
        setLoading(false);
      }
    } catch (err) {
      console.error('Signup error:', err);
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-md mx-auto p-6 bg-default-background rounded-lg border border-neutral-border">
        <div className="text-center">
          <div className="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-heading-2 font-heading-2 text-default-font mb-2">
            Check Your Email
          </h2>
          <p className="text-body font-body text-subtext-color mb-6">
            We've sent you a confirmation link at <strong className="font-body-bold">{email}</strong>. 
            Please check your email and click the link to activate your account.
          </p>
          <Button onClick={onClose} className="w-full">
            Got it
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-default-background rounded-lg border border-neutral-border">
      <div className="mb-6">
        <h2 className="text-heading-2 font-heading-2 text-default-font mb-2">
          Create Account
        </h2>
        <p className="text-body font-body text-subtext-color">
          Join our community of music visualizers.
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
          error={!!emailError}
          helpText={emailError || undefined}
          required
        />

        <div>
          <AuthTextField
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="Create a strong password"
            disabled={loading}
            error={password.length > 0 && !passwordValidation.isValid}
            required
          />
          <PasswordStrengthIndicator 
            validation={passwordValidation} 
            password={password} 
          />
        </div>

        <AuthTextField
          label="Full Name"
          type="text"
          value={fullName}
          onChange={setFullName}
          placeholder="Enter your full name"
          disabled={loading}
        />

        <AuthTextField
          label="Username"
          type="text"
          value={username}
          onChange={setUsername}
          placeholder="Choose a username"
          disabled={loading}
          error={!!usernameError}
          helpText={usernameError || "Optional. Letters, numbers, and underscores only"}
        />

        {error && (
          <div className="text-error-700 text-caption font-caption bg-error-50 p-3 rounded-md border border-error-200">
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={loading || !email || !password || !passwordValidation.isValid || !!emailError || !!usernameError}
          className="w-full"
          loading={loading}
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-caption font-caption text-subtext-color">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onToggleMode}
            className="text-brand-600 hover:text-brand-700 font-caption-bold"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}