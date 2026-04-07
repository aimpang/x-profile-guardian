# Fix Onboarding Loop + Enforce Paid Access

## Current Issue
- Onboarding page 3 "Go to dashboard" calls `done()` -> navigate("/dashboard")
- ProtectedRoute redirects back to onboarding if no connected_accounts
- Creates infinite loop
- Users can skip without payment or X connection

## Plan
1. [x] Update `src/components/ProtectedRoute.tsx`: allow onboarding skip key to prevent redirect loop after "Go to Dashboard"
2. [ ] Reconcile paid-access enforcement in separate pass (subscription + account connection) without reintroducing loop
3. [ ] Test flow: signup -> onboarding -> dashboard navigation

## Next Steps
- Validate redirect behavior in app flow
