# Mr. Plastic frontend

The Next.js frontend is a Spanish-language inventory workspace for the Mr. Plastic
NestJS API. It includes a dashboard, product catalog, branch inventory, stock
movements, branch overview, and sign-in.

## Run the full app locally

You need Node.js 22 or later, pnpm, and Podman. Start PostgreSQL, apply the
backend migrations, then run the backend and frontend in separate terminals.

### 1. Start PostgreSQL

From any directory, create the local PostgreSQL container:

```bash
podman run -d \
  --name plastics-pos-db \
  -e POSTGRES_USER=pos_user \
  -e POSTGRES_PASSWORD=local_dev_password_change_me \
  -e POSTGRES_DB=plastics_pos \
  -p 5432:5432 \
  -v plastics_pos_pgdata:/var/lib/postgresql/data \
  postgres:17-alpine
```

If the container already exists, start it with `podman start plastics-pos-db`
instead. The `plastics_pos_pgdata` volume keeps the database when the container
is stopped.

### 2. Configure and start the backend

In Terminal 1:

```bash
cd backend
pnpm install
```

Create `backend/.env` with:

```dotenv
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=pos_user
DB_PASSWORD=local_dev_password_change_me
DB_NAME=plastics_pos
JWT_SECRET=replace_with_a_private_secret_at_least_32_characters_long
PORT=3000
```

Generate a local JWT secret using `openssl rand -base64 48`. Apply the database
migrations, then start the backend:

```bash
pnpm exec typeorm-ts-node-esm migration:run -d src/database/data-source.ts
pnpm start:dev
```

Leave this terminal running. The API should be available at
`http://localhost:3000`.

### 3. Start the frontend

In Terminal 2, from the repository root:

```bash
cd frontend
pnpm install
pnpm dev --port 3001
```

Open [http://localhost:3001](http://localhost:3001). The frontend's
`/api/backend/*` rewrite proxies requests to `http://localhost:3000/*`, so the
browser uses same-origin requests and the backend does not need CORS
configuration.

If your backend uses a different URL, set `BACKEND_URL` before starting Next.js.
For example:

```bash
BACKEND_URL=http://localhost:3100 pnpm dev --port 3001
```

Restart the frontend after changing `BACKEND_URL`; Next.js reads this setting
when it starts.

## Using the frontend

The dashboard and catalog screens load from the backend. Create products and
branches, then initialize stock for a product at a branch before recording
entries or exits. The inventory movement endpoint checks existing stock and
rejects exits that exceed available quantity.

Sign in with a backend user account to access authenticated functionality. The
backend does not currently provide public sign-up or a seed administrator, so
an initial admin account must be provisioned separately. Sales checkout is not
available yet because the API does not expose a sales endpoint.

If the API is unavailable, the UI shows a connection warning. Confirm PostgreSQL
is running, the backend `.env` values match the database container, migrations
have been applied, and `BACKEND_URL` points to the backend.

## Checks

From `frontend`:

```bash
pnpm lint
pnpm build
```
