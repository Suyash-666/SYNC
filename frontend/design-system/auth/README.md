# SYNC Authentication Pages

Use `AuthPage` as the split-screen authentication experience for SYNC.

## Exports
- `AuthPage`
- `LoginForm`
- `SignupForm`
- `ForgotPasswordForm`

## Dependencies
- `react-hook-form`
- `zod`
- `@hookform/resolvers`
- `framer-motion`
- `lucide-react`

## Notes
- Form submission is simulated with a 1.5s timeout.
- Toast feedback is handled through the shared design-system `Toast` component.
- The left panel is hidden on mobile and the form panel expands to full width.
