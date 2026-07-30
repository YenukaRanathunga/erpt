# TonerERP — Vercel Shared Database Version

This version stores TonerERP data in one central Postgres database. Changes made on one laptop are visible on every other device.

## Deploy on the existing Vercel project

1. Replace the current GitHub repository files with this package.
   The repository root must show `index.html`, `package.json`, `vercel.json`,
   the `api` folder, and the `lib` folder. Do not place the project inside an
   extra parent folder.
2. In the Vercel project dashboard, open **Storage** and connect a Postgres database from the Vercel Marketplace (for example Neon or Supabase).
3. Make sure the integration provides either `POSTGRES_URL` or `DATABASE_URL`.
4. In **Settings → Environment Variables**, add:
   - `ADMIN_PASSWORD` = the administrator password
   - `SESSION_SECRET` = a private random value containing at least 32 characters
5. Redeploy the latest GitHub commit.

In **Vercel → Settings → Build and Deployment**, leave **Root Directory** empty
so Vercel can detect the root-level `api` folder.

After deployment, opening `/api/staff-users` on the Vercel domain must return
JSON. A Vercel `404 NOT_FOUND` page means the `api` folder is missing from the
deployment or the Root Directory is incorrect.

The database table and the initial printer/toner records are created automatically on the first request.

## Login

- Admin name: `admin`
- Admin password: the value configured in `ADMIN_PASSWORD`
- Staff users continue without passwords by selecting their profile.

## Important

- Do not upload `.env` files or database credentials to GitHub.
- The old HTML-only browser data is not automatically imported into this fresh shared database.
- Keep the GitHub repository private.
