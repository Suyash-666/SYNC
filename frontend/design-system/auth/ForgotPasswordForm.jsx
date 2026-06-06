import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowRight, Mail, ShieldCheck } from 'lucide-react';
import { getSupabase } from '../src/lib/supabase';
import { Button, Input } from '../components';

const schema = z.object({ email: z.string().email('Enter a valid email address.') });

export const ForgotPasswordForm = ({ onSwitch, onNotify }) => {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const submit = async (values) => {
    setLoading(true);
    try {
      const supabase = getSupabase();
      const redirectTo =
        typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined;
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, { redirectTo });
      if (error) throw error;
      setSent(true);
      onNotify('success', 'Reset link sent to your email.');
    } catch (error) {
      onNotify('error', error.message || 'Unable to send reset link.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="space-y-6">
        <div className="grid h-14 w-14 place-items-center rounded-md border border-border bg-surface text-success-fg">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <h2 className="font-display text-3xl font-semibold text-foreground">
            Check your inbox
          </h2>
          <p className="mt-3 text-sm leading-6 text-foreground-muted">
            We sent a secure reset link. If you do not see it, check your spam folder.
          </p>
        </div>
        <Button fullWidth onClick={() => onSwitch('login')} leadingIcon={<ArrowLeft className="h-4 w-4" />}>
          Back to log in
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-7">
        <div className="text-2xs font-semibold uppercase tracking-[0.16em] text-foreground-subtle">
          Account recovery
        </div>
        <h2 className="mt-2 font-display text-3xl font-semibold text-foreground">
          Reset your password
        </h2>
        <p className="mt-3 text-sm leading-6 text-foreground-muted">
          We will send a secure reset link to the email address associated with your SYNC account.
        </p>
      </div>

      <form onSubmit={handleSubmit(submit)} className="space-y-4">
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          leftIcon={<Mail className="h-4 w-4" />}
          error={errors.email?.message}
          {...register('email')}
        />
        <Button type="submit" isLoading={loading} fullWidth trailingIcon={<ArrowRight className="h-4 w-4" />}>
          Send reset link
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-foreground-muted">
        Remembered your password?{' '}
        <button
          type="button"
          onClick={() => onSwitch('login')}
          className="font-semibold text-foreground transition-colors hover:text-foreground-muted"
        >
          Back to log in
        </button>
      </div>
    </div>
  );
};

ForgotPasswordForm.propTypes = { onSwitch: PropTypes.func.isRequired, onNotify: PropTypes.func.isRequired };
