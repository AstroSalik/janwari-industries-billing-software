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

- Backend: Render web service
- Database: Neon Postgres
- Desktop app: Electron installer pointing to the hosted API

## 1. Deploy the Backend on Render

This repo includes [render.yaml](/C:/Users/Salik%20Riyaz/Downloads/janwari-industries-billing-software/render.yaml).

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

After deploy, confirm:

- `https://your-render-service.onrender.com/api/health`

It should report database connectivity.

## 2. Point the Desktop App to the Hosted API

On a laptop with the installed app, open:

`%APPDATA%\\janwari-industries-billing-software\\config.json`

Set it like this:

```json
{
  "apiBaseUrl": "https://your-render-service.onrender.com/api",
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

## 3. Fresh Laptop Validation

On a new laptop:

1. Install the `.exe`.
2. Launch once so the app creates `config.json`.
3. Edit `config.json` to use hosted mode.
4. Relaunch the app.
5. Log in with the admin credentials you configured on the server.

## 4. Logs and Runtime Files

Installed app paths:

- Install folder:
  - `%LOCALAPPDATA%\\Programs\\Janwari Industries Billing`
- Runtime config:
  - `%APPDATA%\\janwari-industries-billing-software\\config.json`
- Backend log:
  - `%APPDATA%\\janwari-industries-billing-software\\backend.log`

## 5. Security Notes

- Do not ship production `DATABASE_URL` and `CLAUDE_API_KEY` to every laptop if you are using hosted mode.
- Rotate any secrets that were previously bundled into installers or committed locally.
- Prefer hosted mode for production because it keeps secrets server-side.

## 6. Recommended Go-Live Order

1. Deploy backend to Render.
2. Verify `/api/health`.
3. Update one test laptop to hosted mode in `config.json`.
4. Verify login, invoices, Snap-to-Bill, and PDF generation.
5. Roll out to all laptops.
