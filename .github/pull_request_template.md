## Summary
- What changed?

## Validation
- [ ] `npm test` passes
- [ ] No secrets, .env, Tide adapter, or admin tokens committed
- [ ] Real Tide-specific behavior was tested against a live realm (or marked unverified)
- [ ] Screenshots/video for UI changes

## Security reviewer
- [ ] Every new protected API uses `withAuth` and server-side role checks
- [ ] No new role-assignment bypass endpoint
