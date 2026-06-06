import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Chrome, Github, Lock, Mail, User } from 'lucide-react';
import { getSupabase } from '../src/lib/supabase';
import { setSession } from '../src/store/authSlice';
import { syncSocketAuth } from '../src/lib/socket';
import { Button, Input } from '../components';

const schema = z
  .object({
    fullName: z.string().min(1, 'Full name is required.'),
    email: z.string().email('Enter a valid email address.'),
    password: z.string().min(8, 'Password must be at least 8 characters.'),
    confirmPassword: z.string().min(1, 'Please confirm your password.'),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match.',
  });

const passwordChecks = [
  { id: 'length', label: '8+ characters' },
  { id: 'case', label: 'Mixed case' },
  { id: 'digit', label: 'One number' },
];

export const SignupForm = ({ onSwitch, onNotify }) => {
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '' },
  });

  const password = watch('password') || '';
  const checkResults = {
    length: password.length >= 8,
    case: /[a-z]/.test(password) && /[A-Z]/.test(password),
    digit: /\d/.test(password),
  };

  const submit = async (values) => {
    setLoading(true);
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: { data: { full_name: values.fullName } },
      });
      if (error) throw error;
      if (!data?.session) {
        onNotify(
          'info',
          'Account created. Check your email to confirm, then log in.'
        );
        onSwitch('login');
        return;
      }

      // Create the application "User" row in the same transaction as the
      // auth.users row, so id alignment holds from day one. The RLS policy
      // lets the user insert their own row when user_id = auth.uid().
      const { error: profileErr } = await supabase
        .from('User')
        .insert({
          id: data.user.id,
          email: values.email,
          full_name: values.fullName,
          role: 'STUDENT',
        });
      if (profileErr && !String(profileErr.message).toLowerCase().includes('duplicate')) {
        throw profileErr;
      }

      dispatch(setSession({ user: data.user, supabaseSession: data.session }));
      syncSocketAuth();
      onNotify('success', 'Account created. You are signed in.');
      navigate('/onboarding', { replace: true });
    } catch (error) {
      onNotify('error', error.message || 'Unable to create account.');
    } finally {
      setLoading(false);
    }
  };

  const invalid = () => onNotify('error', 'Please fix the highlighted signup fields.');

  return (
    <div>
      <div className="mb-7">
        <div className="text-2xs font-semibold uppercase tracking-[0.16em] text-foreground-subtle">
          Start focused
        </div>
        <h2 className="mt-2 font-display text-3xl font-semibold text-foreground sm:text-4xl">
          Create your account
        </h2>
        <p className="mt-3 text-sm leading-6 text-foreground-muted">
          Build a calmer semester with planning, AI support, and collaboration in one workspace.
        </p>
      </div>

      <form onSubmit={handleSubmit(submit, invalid)} className="space-y-4">
        <Input
          label="Full name"
          autoComplete="name"
          leftIcon={<User className="h-4 w-4" />}
          error={errors.fullName?.message}
          {...register('fullName')}
        />
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
          autoComplete="new-password"
          leftIcon={<Lock className="h-4 w-4" />}
          error={errors.password?.message}
          {...register('password')}
        />
        <Input
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          leftIcon={<Lock className="h-4 w-4" />}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        {password ? (
          <ul className="grid grid-cols-3 gap-1.5 rounded-md border border-border-subtle bg-background-subtle p-2 text-xs">
            {passwordChecks.map((c) => (
              <li
                key={c.id}
                className={[
                  'flex items-center gap-1.5',
                  checkResults[c.id] ? 'text-success-fg' : 'text-foreground-subtle',
                ].join(' ')}
              >
                <Check className={['h-3 w-3', checkResults[c.id] ? 'opacity-100' : 'opacity-25'].join(' ')} />
                {c.label}
              </li>
            ))}
          </ul>
        ) : null}

        <Button type="submit" isLoading={loading} fullWidth trailingIcon={<ArrowRight className="h-4 w-4" />}>
          Create account
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
        Already have an account?{' '}
        <button
          type="button"
          onClick={() => onSwitch('login')}
          className="font-semibold text-foreground transition-colors hover:text-foreground-muted"
        >
          Log in
        </button>
      </div>
    </div>
  );
};

SignupForm.propTypes = { onSwitch: PropTypes.func.isRequired, onNotify: PropTypes.func.isRequired };
