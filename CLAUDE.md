# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Dodo backend — Express.js 4 API server for a creator platform. TypeScript, MongoDB (Mongoose), pnpm.

The frontend repo is at `../dodofe/`. Full cross-repo reference in `DODO-CODEBASE-REFERENCE.md`.

## Commands

```bash
pnpm install              # install dependencies
pnpm dev                  # dev server on :3002 (ts-node-dev with respawn)
pnpm build                # compile TypeScript to dist/
pnpm start                # run compiled output (node dist/app.js)
pnpm lint                 # ESLint
pnpm test                 # Jest (uses mongodb-memory-server)
pnpm test:watch           # Jest watch mode
pnpm test:coverage        # Jest with coverage
docker compose up -d      # local MongoDB on :27017 + Mongo Express on :8081
```

### Utility Scripts
```bash
pnpm create-mediakit      # bulk create media kits from script/creator-data.json
pnpm test-email           # test SMTP connectivity
```

## Architecture

### Route Structure
All routes prefixed `/api/v1` — registered in `src/routes/index.ts`.

**Public routes** (no auth):
- `/auth` — register, complete-profile, get/update user
- `/dodo-pages/get-by-url` — public page lookup
- `/block/poll-vote` — public poll voting
- `/invoice` — all invoice endpoints
- `/analytics` — page-view, block-interaction, timeSpent recording
- `/mediakit` — most mediakit endpoints

**Protected routes** (`authenticateUser` middleware):
- `/dodo-pages` — CRUD operations
- `/block` — block management
- `/coins` — coin system
- `/client`, `/bankDetails`, `/recipient` — invoice entities
- `/content` — AI content generation

### Auth
JWT-based. Middleware in `src/middleware/auth.ts`.
- FE sends `Authorization: Bearer <token>`
- Middleware verifies JWT, attaches `userId` to `req`
- Token generated in auth controller with 7-day expiry
- Secret: `JWT_SECRET` env var
- Test bypass: `NODE_ENV=test && token="test-token"`

### Database
MongoDB via Mongoose. Connection in `src/config/database.ts`.

Models in `src/models/`:
- `user/` — User (refs: dodoPages, invoices, mediaKit, coinTransactions)
- `block/` — Block + type-specific schemas (LinkBlock, PollBlock, ProductBlock, HeadingBlock, SeparatorBlock)
- `invoice/` — Invoice, Item, BankDetail, RecipientDetail, ClientDetail
- `mediakit/` — MediaKit (Instagram profile, brand collabs, analytics)
- `analytics/` — PageView, BlockInteraction
- `dodoCoin/` — CoinTransaction

### File Uploads
Multer (in-memory) → AWS S3 upload. Middleware: `src/middleware/fileUpload.ts`.
- S3 folders: `dodo-profiles/`, `dodo-audio/`, `block-images/`, `brand-logos/`, `media-kit-profile-images/`
- Max file size: 15MB
- Accepted MIME: `image/*`, `audio/*`
- Files uploaded with `public-read` ACL

### Controller Pattern
Each domain has a folder in `src/controllers/` with controller file + `__tests__/` subfolder.
Controllers receive Express req/res, call Mongoose models directly (no service layer).

### Third-Party Services
- **AWS S3**: file storage — `src/middleware/fileUpload.ts`
- **Google Gemini AI**: content generation + analytics screenshot parsing — `src/utils/geminiService.ts`
- **Gmail SMTP**: admin email notifications — `src/utils/emailService.ts`
- **Swagger**: API docs at `/api-docs` — config in `src/app.ts`, specs in `src/docs/`

### Logging
Winston logger in `src/utils/logger.ts`. Outputs to `error.log`, `combined.log`, and console (non-prod).
Helper: `logEndpoint()` middleware logs all HTTP requests with duration.

### Environment Variables
| Variable | Purpose | Default |
|----------|---------|---------|
| `PORT` | Server port | 3002 |
| `MONGODB_URI` | MongoDB connection | localhost:27017/dodo |
| `JWT_SECRET` | JWT signing secret | dev fallback key |
| `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET_NAME` | S3 file storage | — |
| `AI_API_KEY` | Google Gemini API | — |
| `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `ADMIN_EMAIL` | SMTP email | Gmail defaults |

### Testing
Jest + Supertest + mongodb-memory-server. Setup in `src/test/setup.ts`.
Test files colocated: `src/controllers/<domain>/__tests__/<name>.test.ts`
Also: `src/routes/__tests__/protectedRoutes.test.ts`

## Key Files

| Purpose | Path |
|---------|------|
| Express app + Swagger setup | `src/app.ts` |
| Route registry | `src/routes/index.ts` |
| Env config | `src/config/index.ts` |
| MongoDB connection | `src/config/database.ts` |
| JWT auth middleware | `src/middleware/auth.ts` |
| S3 upload middleware | `src/middleware/fileUpload.ts` |
| Gemini AI service | `src/utils/geminiService.ts` |
| Email service | `src/utils/emailService.ts` |
| Winston logger | `src/utils/logger.ts` |
| JWT utility | `src/utils/jwt.ts` |
| Dockerfile | `Dockerfile` |
| CI/CD pipeline | `.gitlab-ci.yml` |

## Known Issues
- Dockerfile exposes port 3001 but app defaults to 3002
- Some mediakit routes have `authenticateUser` commented out
- Invoice routes have no auth middleware
- No rate limiting middleware
- MongoDB Atlas credentials hardcoded as fallback in `src/config/database.ts`
- No background job queue — emails are synchronous and block the request
