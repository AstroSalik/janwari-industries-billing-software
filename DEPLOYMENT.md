# Janwari Industries Billing Production Deployment

This app now supports two runtime modes:

1. Hosted API mode
2. Embedded desktop backend mode

Hosted API mode is the recommended production setup.

## Why Hosted API Mode Is Better

- The desktop app talks to your hosted API instead of connecting to Neon directly.
- Database and Claude secrets stay on the server.
- New laptops only need internet access to your API domain.
- DNS issues with the Neon hostname on individual laptops are avoided because only your hosted backend needs to resolve Neon.

## Recommended Production Architecture

- Backend: Koyeb web service
- Database: Neon Postgres
- Desktop app: Electron installer pointing to the hosted API

Koyeb is the recommended option here because its current starter offering is friendlier for a free hosted API than Render's paid web service default.

## 1. Deploy the Backend on Koyeb

Recommended Koyeb setup:

1. Push this repo to GitHub.
2. In Koyeb, create a new Web Service from GitHub.
3. Select this repository.
4. Set the service root directory to `server`.
5. Use these build and start commands:
   - Build command: `npm install && npm run db:generate && npm run build`
   - Start command: `npm start`
6. Set the environment variables:
   - `NODE_ENV=production`
   - `DATABASE_URL`
   - `CLAUDE_API_KEY`
   - `JWT_SECRET`
   - `DEFAULT_ADMIN_USERNAME=admin`
   - `DEFAULT_ADMIN_PASSWORD`
   - `ALLOWED_ORIGINS=file://,null`

Notes:

- The backend is now self-contained enough to deploy directly from the `server` folder.
- The `db:generate` script explicitly targets `server/prisma/schema.prisma`, so Koyeb does not need the repo-root Prisma config to build.
- On free hosting, cold starts and lower resources are still possible, so test Snap-to-Bill under real usage before treating it as fully battle-hardened.

After deploy, confirm:

- `https://your-koyeb-service-domain/api/health`

It should report database connectivity.

## 2. Render Fallback

This repo also includes [render.yaml](/C:/Users/Salik%20Riyaz/Downloads/janwari-industries-billing-software/render.yaml) if you later move to Render.

Render setup:

1. Push this repo to GitHub.
2. In Render, create a new Blueprint or Web Service from the repo.
3. If using the blueprint, Render will pick up `render.yaml`.
4. Set the required environment variables:
   - `DATABASE_URL`
   - `CLAUDE_API_KEY`
   - `DEFAULT_ADMIN_PASSWORD`
   - `ALLOWED_ORIGINS`
5. Optional:
   - `DEFAULT_ADMIN_USERNAME` defaults to `admin`
   - `JWT_SECRET` is auto-generated in `render.yaml`

Recommended `ALLOWED_ORIGINS` values:

- Your future web frontend origin, if you build one
- Leave desktop support intact because Electron file-origin requests are already allowed by the server

## 3. Point the Desktop App to the Hosted API

On a laptop with the installed app, open:

`%APPDATA%\\janwari-industries-billing-software\\config.json`

Set it like this:

```json
{
  "apiBaseUrl": "https://your-hosted-api-domain/api",
  "preferHostedApi": true,
  "port": "3000",
  "defaultAdminUsername": "admin",
  "defaultAdminPassword": "your-admin-password"
}
```

Notes:

- In hosted mode, the desktop app does not start its embedded backend.
- `databaseUrl` and `claudeApiKey` are not needed on client laptops in hosted mode.
- You can distribute the same installer to all laptops and only update `config.json` if needed.

## 4. Fresh Laptop Validation

On a new laptop:

1. Install the `.exe`.
2. Launch once so the app creates `config.json`.
3. Edit `config.json` to use hosted mode.
4. Relaunch the app.
5. Log in with the admin credentials you configured on the server.

## 5. Logs and Runtime Files

Installed app paths:

- Install folder:
  - `%LOCALAPPDATA%\\Programs\\Janwari Industries Billing`
- Runtime config:
  - `%APPDATA%\\janwari-industries-billing-software\\config.json`
- Backend log:
  - `%APPDATA%\\janwari-industries-billing-software\\backend.log`

## 6. Security Notes

- Do not ship production `DATABASE_URL` and `CLAUDE_API_KEY` to every laptop if you are using hosted mode.
- Rotate any secrets that were previously bundled into installers or committed locally.
- Prefer hosted mode for production because it keeps secrets server-side.

## 7. Recommended Go-Live Order

1. Deploy backend to Koyeb.
2. Verify `/api/health`.
3. Update one test laptop to hosted mode in `config.json`.
4. Verify login, invoices, Snap-to-Bill, and PDF generation.
5. Roll out to all laptops.
