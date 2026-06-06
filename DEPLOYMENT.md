# Deployment Checklist for SYNC

1. Create Supabase project (or provide external Postgres) and copy `DATABASE_URL` into the backend env.
2. Create storage buckets in Supabase: `resources`, `avatars` and set permissions.
3. Configure Supabase Auth (enable email provider). Add OAuth providers (Google, GitHub) if desired.
4. Set strong secrets:
   - `JWT_SECRET`: use `openssl rand -base64 64` to generate.
   - `JWT_REFRESH_SECRET`: same method.
5. Deploy backend (example: Railway):
   - Connect your GitHub repo.
   - Set environment variables from `.env.example.backend`.
   - Run `npx prisma migrate deploy` after deployment to apply migrations.
6. Deploy frontend (example: Vercel):
   - Connect GitHub repo.
   - Set `VITE_API_URL` to your backend public URL (e.g., https://sync-backend.railway.app/api/v1).
7. Test the full auth flow: signup, login, refresh, forgot/reset password, and logout.
8. Verify storage uploads (resources and avatars) and Socket.IO realtime features.
9. Monitor logs and metrics; configure alerts for error rates and latency.

Optional:
- Configure Redis cloud provider and update `REDIS_URL` for production brute-force counters and session storage.
- Configure Sentry or similar for runtime error tracking.

## Storage CORS configuration (Checkpoint 3+)

When `VITE_USE_SUPABASE=storage` is enabled, the browser uploads files
directly to Supabase Storage. The `resources` and `avatars` buckets must
allow the frontend's origin.

In the **Supabase Dashboard → Storage → [bucket] → Configuration → CORS**,
add:

```
Allowed origins:
- http://localhost:5173
- https://<your-vercel-domain>.vercel.app
- (your custom domain, if any)

Allowed methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
Allowed headers: Authorization, Content-Type, x-client-info, apikey
Expose headers: Content-Range, Content-Length, ETag
Max age: 3600
```

If a new origin is added later (custom domain, staging URL, etc.), update
both buckets' CORS lists in the Supabase Dashboard.

