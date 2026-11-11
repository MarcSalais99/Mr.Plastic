# Mr. Plastic backend

Mr. Plastic is a NestJS REST API for managing products, branches, branch-level
inventory, stock movements, and user authentication. It uses PostgreSQL and
TypeORM.

## Requirements

- Node.js (22 or later recommended)
- pnpm (the repository uses pnpm)
- Podman

## Start PostgreSQL with Podman

Create and start the local PostgreSQL 17 container with a persistent Podman
volume:

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

The password above is for local development only. Change it before using this
database in any shared or deployed environment.

Check that the container is running and accepting connections:

```bash
podman ps
podman logs plastics-pos-db
```

The named volume `plastics_pos_pgdata` preserves the database when you stop or
remove the container. Stop and start the existing container with:

```bash
podman stop plastics-pos-db
podman start plastics-pos-db
```

If the container already exists, use `podman start plastics-pos-db` instead of
running `podman run` again.

## Configure and run the backend

From the `backend` directory, install dependencies:

```bash
pnpm install
```

Create `backend/.env` with the connection details matching the Podman command,
and a private JWT signing secret of at least 32 characters:

```dotenv
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=pos_user
DB_PASSWORD=local_dev_password_change_me
DB_NAME=plastics_pos
JWT_SECRET=replace_with_a_private_secret_at_least_32_characters_long
PORT=3000
```

Generate a suitable local JWT secret with:

```bash
openssl rand -base64 48
```

Apply the database migrations before starting the API. Migrations are not run
automatically by the application:

```bash
pnpm exec typeorm-ts-node-esm migration:run -d src/database/data-source.ts
```

Start the backend in watch mode:

```bash
pnpm start:dev
```

The API listens on `http://localhost:3000` by default. Override `PORT` in
`.env` to use another port. The frontend defaults to port `3000` as well, so run
it on a different port (for example `3001`) and set its `BACKEND_URL` if the
backend is not on `http://localhost:3000`.

For a production build:

```bash
pnpm build
pnpm start:prod
```

## API overview

The backend validates request bodies and rejects unknown DTO fields.

| Method | Path | Description | Authentication |
| --- | --- | --- | --- |
| `GET` | `/` | API greeting | No |
| `GET`, `POST` | `/products` | List and create products | No |
| `GET`, `POST` | `/branches` | List and create branches | No |
| `GET`, `POST` | `/branch-inventory` | List and initialize branch stock | No |
| `GET`, `POST` | `/inventory-movements` | List movements and record stock entries or exits | No |
| `POST` | `/auth/login` | Sign in and receive a bearer access token | No |
| `GET` | `/auth/profile` | Return the current authenticated user | Valid JWT |
| `GET` | `/auth/admin-test` | Example admin-only route | JWT with admin role |
| `GET`, `POST` | `/users` | List users and create a user | JWT with admin role |
| `GET` | `/users/:id` | Get a user by ID | JWT with admin role |
| `PATCH` | `/users/:id` | Update a user | JWT with admin role |
| `PATCH` | `/users/:id/deactivate` | Deactivate a user | JWT with admin role |

For protected routes, set the `Authorization` header to the standard `Bearer`
scheme followed by the `access_token` returned by `POST /auth/login`. Access
tokens expire after 15 minutes. User administration is restricted by role:
`admin_general` and `admin_sucursal`; branch administrators can only manage
employees assigned to their own branch.

There is currently no seed or public registration endpoint for the first
administrator. Provision an initial admin account before using the protected
user-management routes. Product, branch, inventory, and movement routes are
currently public; protect them before exposing the API to an untrusted network.

## Development checks

```bash
pnpm lint
pnpm test
pnpm test:e2e
pnpm build
```
