import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDispatch } from 'react-redux';
import { ArrowRight, Chrome, Github, Lock, Mail } from 'lucide-react';
import { authApi } from '../src/api';
import { setCredentials } from '../src/store/authSlice';
import { syncSocketAuth } from '../src/lib/socket';
import { Button, Input } from '../components';

const schema = z.object({
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
});

export const LoginForm = ({ onSwitch, onNotify }) => {
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const submit = async (values) => {
    setLoading(true);
    try {
      const data = await authApi.login(values);
      dispatch(setCredentials({ user: data.user, accessToken: data.access || data.accessToken }));
      syncSocketAuth();
      onNotify('success', 'Welcome back. You are signed in.');
    } catch (error) {
      onNotify('error', error.response?.data?.message || error.message || 'Unable to log in.');
    } finally {
      setLoading(false);
    }
  };

  const invalid = () => onNotify('error', 'Please fix the highlighted login fields.');

  return (
    <div>
      <div className="mb-7">
        <div className="text-2xs font-semibold uppercase tracking-[0.16em] text-foreground-subtle">
          Welcome back
        </div>
        <h2 className="mt-2 font-display text-3xl font-semibold text-foreground sm:text-4xl">
          Log in to SYNC
        </h2>
        <p className="mt-3 text-sm leading-6 text-foreground-muted">
          Continue where you left off. Your courses, deadlines, and study flow are waiting.
        </p>
      </div>

      <form onSubmit={handleSubmit(submit, invalid)} className="space-y-4">
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          leftIcon={<Mail className="h-4 w-4" />}
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          leftIcon={<Lock className="h-4 w-4" />}
          error={errors.password?.message}
          {...register('password')}
        />

        <div className="flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={() => onSwitch('forgot')}
            className="font-medium text-foreground-muted transition-colors hover:text-foreground"
          >
            Forgot password?
          </button>
          <button
            type="button"
            onClick={() => onSwitch('signup')}
            className="font-medium text-foreground transition-colors hover:text-foreground-muted"
          >
            Create account
          </button>
        </div>

        <Button type="submit" isLoading={loading} fullWidth trailingIcon={<ArrowRight className="h-4 w-4" />}>
          Log in
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3 text-2xs font-semibold uppercase tracking-[0.16em] text-foreground-subtle">
        <span className="h-px flex-1 bg-border" />
        Continue with
        <span className="h-px flex-1 bg-border" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" leadingIcon={<Chrome className="h-4 w-4" />}>Google</Button>
        <Button variant="secondary" leadingIcon={<Github className="h-4 w-4" />}>GitHub</Button>
      </div>

      <div className="mt-6 text-center text-sm text-foreground-muted">
        New to SYNC?{' '}
        <button
          type="button"
          onClick={() => onSwitch('signup')}
          className="font-semibold text-foreground transition-colors hover:text-foreground-muted"
        >
          Create an account
        </button>
      </div>
    </div>
  );
};

LoginForm.propTypes = { onSwitch: PropTypes.func.isRequired, onNotify: PropTypes.func.isRequired };
