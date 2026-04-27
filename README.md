# Northline Vault

Northline Vault is a polished team password manager built for a hiring-grade assessment. It is designed as an internal company tool for shared credentials, with a deliberate lock screen, client-side encryption, clean operational workflows, and visible security hygiene signals.

The app is locked by default on every load. Each person can create a separate encrypted vault profile with their own master password. That password derives client-side keys, secret fields are encrypted before persistence, and decrypted values only exist in the active browser session.

## Project overview

This project focuses on the real workflow teams need when they manage shared accounts for infrastructure, vendors, finance tools, support systems, and project operations:

- a trustworthy lock and unlock experience
- fast search over safe metadata
- quick add and edit flows for shared credentials
- strong generator and strength guidance
- clear alerts for reused passwords and stale entries
- exportable encrypted backups

It is intentionally not a generic admin panel. The product direction is a calm, premium-feeling internal tool with security thinking visible in both the architecture and the UX.

## Why this product exists

Shared credentials still end up in chat threads, docs, or ad hoc notes far too often. Teams need a tool that makes the secure path feel faster than the sloppy one.

Northline Vault is built around that principle:

- secure by default on load
- fast to search once unlocked
- clear about what is encrypted and what is not
- opinionated about weak, reused, and stale credentials
- easy to run locally for assessment and review

## Core features

- Personal vault profiles so each person can use a separate master password
- Master-password setup flow for new profile creation
- Returning-user profile selection and unlock flow with clear feedback on failure
- Vault locked by default whenever the app loads
- Client-side AES-GCM encryption for:
  - username
  - password
  - notes
- Vault overview with:
  - instant search
  - filter by group/tag
  - filter by strength
  - reused-only filter
  - recently updated filter
- Shared credential CRUD for:
  - service/platform name
  - URL
  - username
  - password
  - notes
  - department
  - project
  - category
  - tags
- Password generator with:
  - configurable length
  - uppercase toggle
  - number toggle
  - symbol toggle
  - live strength feedback
- Live password strength classification: weak, fair, strong
- One-click copy for username and password
- Optional reveal controls with timed auto-hide
- Auto-lock on inactivity plus manual lock action
- Reused password detection without storing plaintext passwords
- Security Health Center with:
  - total credentials
  - reused passwords count
  - weak / fair / strong distribution
  - missing classification count
  - stale credentials needing review
  - actionable recommendations
- Encrypted JSON backup export
- Responsive app shell with sidebar, topbar, motion, and strong empty states

## Routes

- `/lock` - first-time setup and returning-user unlock
- `/vault` - searchable vault overview and Security Health Center
- `/vault/new` - add a credential
- `/vault/[id]/edit` - edit a credential
- `/settings` - preferences, backup export, and master password rotation

## Tech stack

- Next.js 15 App Router
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- Framer Motion
- Prisma
- PostgreSQL through Prisma, with Docker Compose local Postgres and Neon-ready environment variables
- Web Crypto API
- `hash-wasm` Argon2id for browser-side key derivation
- zod
- react-hook-form
- Recharts
- Vitest

## Security architecture

### 1. Master password model

- The master password is never stored.
- A random per-vault-profile salt is generated on setup.
- Argon2id derives master key material in the browser from:
  - the entered master password
  - the selected vault profile salt

### 2. Key separation

The derived master material is expanded into separate responsibilities:

- encryption/decryption key material
- vault verification material
- password fingerprinting material

This avoids reusing a single derived key for unrelated purposes.

### 3. Encryption model

- Secret fields are encrypted client-side before persistence.
- AES-GCM is used through the Web Crypto API.
- The database never stores plaintext versions of:
  - username
  - password
  - notes
- Decryption happens only after unlock in the browser.

### 4. Vault verification

- The app stores a verifier derived from a dedicated subkey.
- Unlock recomputes the verifier in the browser and compares it locally.
- No server-side plaintext password validation exists.

### 5. Reuse detection

- Plaintext passwords are not stored for reuse checks.
- Each password also gets a deterministic fingerprint derived client-side from a dedicated fingerprint key.
- Matching fingerprints let the UI detect reused passwords.

Tradeoff:

- identical passwords become linkable to each other inside the same vault dataset
- the original plaintext password is still not recoverable from the fingerprint alone

### 6. Session handling

- The vault is locked by default on app load.
- Session key material is kept in memory only.
- Sensitive session state is cleared on manual lock, failed unlock, and inactivity lock.
- The app never stores decrypted secrets or master-password material in `localStorage`.

### 7. Reduced leakage

- Unexpected server failures return generic API errors instead of leaking internal details.
- Plaintext credentials are not logged or returned by APIs.
- Temporary derived byte buffers are zeroed where practical after use.

## Product decisions and tradeoffs

### Plaintext metadata

The following fields are intentionally stored in plaintext:

- service name
- URL
- department
- project
- category
- tags

Reason:

- these fields drive search, filtering, grouping, and fast vault navigation
- encrypting them too would make the product noticeably worse for the assessment goal

This keeps operational metadata usable while still protecting the actual secrets.

### Personal vault profiles

The lock screen supports multiple vault profiles. Each profile has its own salt, verifier, settings, encrypted credentials, password fingerprints, and master password. This fixes the common failure mode where one person creates a vault and everyone else is forced to use that same master password.

Tradeoff:

- credentials are isolated per profile in this version
- a true shared company vault with separate user master passwords would require a random vault data key wrapped separately for each authorized user
- that key-wrapping model is the right next step for production team sharing, but it is larger than the current assessment scope

### PostgreSQL as the default database

The current `main` branch is configured for PostgreSQL so the app can run cleanly in production on Neon/Vercel and locally through Docker Compose. The Prisma schema remains focused and portable, but SQLite is no longer the active runtime database in this branch.

### Clipboard clearing is best effort

Clipboard clearing is configurable, but browsers can refuse delayed clipboard writes depending on permissions and user gesture rules. The UI treats clearing as a best-effort safety measure, not a hard guarantee.

### Backup export scope

This project exports encrypted JSON backups, but does not include an import flow. That was a deliberate scope decision to avoid shipping a half-finished recovery experience.

## Folder structure

```text
src/
  app/
    (workspace)/
    api/
    lock/
  components/
    layout/
    lock/
    providers/
    settings/
    shared/
    ui/
    vault/
  hooks/
  lib/
    constants/
    crypto/
    schemas/
    server/
prisma/
  migrations/
scripts/
tests/
```

## Environment variables

Create a `.env` file with:

```env
DATABASE_URL="postgresql://northline:northline_password@localhost:5432/northline_vault?schema=public"
```

The repo includes `.env.example` with a local PostgreSQL example and a commented Neon example.

Notes:

- `DATABASE_URL` is used by the app and by Prisma during Vercel builds.
- Vercel only needs `DATABASE_URL` for the current schema.
- If your Vercel project build command runs `prisma db push`, the database URL must be available in Production, Preview, and Development environments as needed.

## Database setup

This repo ships with:

- a Prisma schema
- PostgreSQL migrations
- a Docker Compose Postgres service for local runs

For local evaluation:

```bash
npm run prisma:generate
npm run db:migrate
```

`db:migrate` runs `prisma migrate deploy` against the configured PostgreSQL database.

For Docker runs, migrations execute automatically before `next start`.

## Local setup instructions

### Option A: Native local run

Requirements:

- Node.js 22+
- PostgreSQL available locally or a Neon database URL in `.env`

1. Install dependencies

```bash
npm install
```

2. Generate the Prisma client

```bash
npm run prisma:generate
```

3. Apply the database migrations

```bash
npm run db:migrate
```

4. Start the app

```bash
npm run dev
```

5. Open `http://localhost:3000`

The app should open to the locked state and route new setups through `/lock`.

### Option B: Docker local run

Requirements:

- Docker Desktop or Docker Engine with Compose support

1. Build and start the containerized app

```bash
docker compose up --build
```

2. Open `http://localhost:3000`

Notes:

- Compose starts a Postgres 16 service and the app service.
- The image runs Prisma client generation and the Next.js production build at image build time.
- On startup, the app container runs `prisma migrate deploy` before `next start`.
- Vault data persists in the named volume `northline_vault_postgres`.
- To stop the stack:

```bash
docker compose down
```

- To remove the persisted Docker database too:

```bash
docker compose down -v
```

## How to run

### Development

```bash
npm run dev
```

### Docker

```bash
docker compose up --build
```

### Production build

```bash
npm run build
npm run start
```

## Test, lint, and build commands

```bash
npm run lint
npm run test
npm run build
```

## Notes about encrypted backup export

- Export is available from Settings while the vault is unlocked.
- The file contains:
  - vault metadata
  - vault settings
  - encrypted credential records
  - password fingerprints
- The file does not contain plaintext username, password, or notes.
- Recovery still depends on knowing the master password used to derive the keys for that specific vault profile.
- For a real production version, the next step would be signed exports plus import-time integrity validation.

## Final QA highlights

The final pass explicitly tightened several areas beyond the initial implementation:

- preserved return-to-task behavior after manual lock and unlock
- added separate vault profiles so each person can create a distinct master password
- scoped credential, settings, and rotation APIs by vault id instead of using the first vault in the database
- removed ambiguous active navigation states
- improved form-level error handling for save and rotation flows
- added safer server error exposure behavior
- zeroed temporary derived key buffers where practical
- fixed generator randomness bias
- reduced accidental form resets in settings and setup flows
- improved tag input behavior on blur, backspace, and max-tag handling
- tightened filter and toggle accessibility labels and associations
- corrected password masking edge cases and empty-strength visual feedback
- surfaced item-level review and classification warnings
- improved settings validation feedback, backup guidance, and small-screen button wrapping

## What I would build next with 3 more days

1. Encrypted backup import with integrity checks and recovery UX
2. Per-entry owners, review acknowledgements, and change history
3. Shared organization vaults with per-user wrapped vault keys and role-aware access
4. SSO-backed identity, invitations, and audit history
5. Scheduled rotation reminders and per-entry last-reviewed metadata
6. Playwright end-to-end tests for profile setup, unlock, CRUD, lock, and settings

## Verification completed

The following were verified in this repository after the final QA pass:

- `npm run lint`
- `npm run test`
- `npm run build`

Docker artifacts are included for local containerized runs:

- `Dockerfile`
- `docker-compose.yml`
- `.dockerignore`

The Compose stack includes the app and a PostgreSQL service, so reviewers do not need to install Postgres separately for the Docker path.

## Assessment summary

Northline Vault is a complete, working web app built to demonstrate product judgment, security thinking, and implementation quality together. The core flows are intentional, the encryption model is credible for the scope, and the UX is shaped like a real internal company tool rather than a scaffolded dashboard.
