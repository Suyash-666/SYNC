# SYNC Onboarding Wizard

A 5-step onboarding flow for SYNC.

## Exports
- `OnboardingPage`
- `OnboardingProgress`

## Behavior
- Uses React Hook Form and Zod for each step.
- Stores accumulated onboarding data in local state inside `OnboardingPage`.
- Animates step changes with Framer Motion `AnimatePresence`.
- Logs the final onboarding object on finish and navigates to `/dashboard`.
