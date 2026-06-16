# Dodo Platform - Codebase Reference

> A creator platform for content creators/influencers to build personal pages, manage invoices, showcase media kits, and track analytics.

## High-Level Architecture

```
[Mobile/Web Browser]
        |
        | HTTPS (axios)
        |
[Next.js Frontend (dodofe)]  ──→  Firebase (Phone Auth + reCAPTCHA)
        |
        | REST API (JSON)
        | Base URL: https://api.dodoclub.in/api/v1/
        |
[Express.js Backend (dodobe)]
        |
        ├── MongoDB Atlas (data)
        ├── AWS S3 (file storage: images, audio)
        ├── Google Gemini AI (content gen, analytics parsing)
        ├── Gmail SMTP (email notifications)
        └── Mixpanel (analytics - FE only)
```

---

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15, React 18, TypeScript, Tailwind CSS, pnpm |
| **State** | Redux Toolkit + Redux Persist (localStorage) |
| **HTTP Client** | Axios with interceptors |
| **Auth Provider** | Firebase Phone Auth (OTP) |
| **Backend** | Express.js 4, TypeScript, Node.js |
| **Database** | MongoDB (Mongoose ODM) |
| **File Storage** | AWS S3 (multer → S3) |
| **AI** | Google Gemini 2.0 Flash |
| **Email** | Nodemailer + Gmail SMTP |
| **Analytics** | Mixpanel (FE), custom PageView/BlockInteraction models (BE) |
| **CI/CD** | GitLab CI → Docker → AWS EC2 ASG |
| **API Docs** | Swagger (BE: /api-docs) |

---

## Repos

| Repo | Path | Description |
|------|------|-------------|
| `dodofe` | `/Users/aakashmac/DevOps/Github/dodofe` | Next.js frontend |
| `dodobe` | `/Users/aakashmac/DevOps/Github/dodobe` | Express.js backend |

---

## Authentication Flow

```
1. User enters phone number (FE: /login)
2. Firebase sends OTP via reCAPTCHA verification
3. User enters OTP → Firebase verifies → returns Firebase UID
4. FE calls POST /auth/register with { mobileNumber, firebaseUid }
5. BE creates/finds user, generates JWT (7-day expiry), returns token + userId
6. FE stores token in localStorage (key: dodo_1.0.0_token) and Redux
7. Axios interceptor attaches "Authorization: Bearer <token>" to all requests
8. BE middleware verifies JWT, attaches userId to req object
9. On 401/403 response → FE auto-logout and redirect to /login
```

**Key files:**
- FE auth: `dodofe/app/login/LoginNumber/index.tsx`, `dodofe/app/login/LoginOtp/index.tsx`
- FE interceptor: `dodofe/api/interceptor.ts`
- FE Firebase config: `dodofe/config/firebase.ts`
- BE auth middleware: `dodobe/src/middleware/auth.ts`
- BE JWT util: `dodobe/src/utils/jwt.ts`
- BE auth controller: `dodobe/src/controllers/auth/authController.ts`

---

## Frontend → Backend API Contract

### How FE Calls BE

- **HTTP Client:** Axios instance in `dodofe/api/interceptor.ts`
- **Base URL:** `https://api.dodoclub.in/api/v1/` (or `NEXT_PUBLIC_BACKEND_API_URL`)
- **Auth header:** `Authorization: Bearer <jwt_token>` + `token: <jwt_token>`
- **File uploads:** `multipart/form-data` (Content-Type overridden per request)
- **Response shape:** `{ success: boolean, message: string, data: any }`
- **Error handling:** Interceptor catches 401→logout, 404→error page, 413→file too large
- **API service functions:** `dodofe/api/services.ts`
- **Endpoint constants:** `dodofe/api/constants.ts`

### Complete Endpoint Map (FE → BE)

#### Auth
| FE Call | BE Route | Auth | Purpose |
|---------|----------|------|---------|
| `POST /auth/register` | `POST /auth/register` | No | Register/login user |
| `POST /auth/complete-profile` | `POST /auth/complete-profile` | No | Set name + interests |
| `GET /auth/user/:userId` | `GET /auth/user/:userId` | No | Get user details |
| `PATCH /auth/update/:userId` | `PATCH /auth/update/:userId` | No | Update user |
| `POST /update-user-details/:userId` | `POST /auth/update/:userId` | No | Update with file upload |

#### DodoPage (Creator Profile)
| FE Call | BE Route | Auth | Purpose |
|---------|----------|------|---------|
| `GET /dodo-pages/get-by-url/:url` | `GET /dodo-pages/get-by-url/:url` | No | Load page by URL (public) |
| `PATCH /dodo-pages/update` | `PATCH /dodo-pages/update` | Yes | Update profile pic, bio, etc. |
| `PATCH /dodo-pages/update-blocks/:pageId` | `PATCH /dodo-pages/update-blocks/:pageId` | Yes | Reorder blocks list |

#### Blocks (Content Cards)
| FE Call | BE Route | Auth | Purpose |
|---------|----------|------|---------|
| `POST /block/create` | `POST /block/create` | Yes | Create block (with image upload) |
| `GET /block/get-by-dodo-page-id/:pageId` | `GET /block/get/:dodoPageUrl` | Yes | Get all blocks for page |
| `GET /block/getById/:blockId` | `GET /block/getById/:blockId` | Yes | Get single block |
| `PATCH /block/update` | `PATCH /block/update` | Yes | Update block |
| `POST /block/reorder` | `POST /block/reorder` | Yes | Reorder blocks |
| `POST /block/archive` | (archive logic in update) | Yes | Archive block |
| `GET /block/get-archived-blocks/:url` | `GET /block/get-archived-blocks/:url` | Yes | List archived blocks |
| `DELETE /block/delete` | `DELETE /block/delete` | Yes | Delete block |
| `POST /block/poll-vote` | `POST /block/poll-vote` | No | Public poll voting |
| `POST /block/get-poll-responses` | `POST /block/get-poll-responses` | Yes | Get poll results |

#### Links (Social Links)
| FE Call | BE Route | Auth | Purpose |
|---------|----------|------|---------|
| `POST /create-links` | `POST /create-links` | Yes | Create link |
| `GET /block-links/:userId` | `GET /block-links/:userId` | Yes | Get user's links |
| `GET /link/:linkId` | `GET /link/:linkId` | Yes | Get link detail |
| `POST /link/edit` | `POST /link/edit` | Yes | Edit link |
| `POST /link/archive` | `POST /link/archive` | Yes | Archive link |
| `POST /link/delete` | `POST /link/delete` | Yes | Delete link |
| `POST /reorder-links` | `POST /reorder-links` | Yes | Reorder links |

#### Invoice System
| FE Call | BE Route | Auth | Purpose |
|---------|----------|------|---------|
| `POST /invoice/create` | `POST /invoice/create` | No | Create invoice |
| `GET /invoice/getInvoice/:id` | `GET /invoice/getInvoice/:id` | No | Get invoice |
| `POST /invoice/getAllInvoices` | `POST /invoice/getAllInvoices` | No | List invoices |
| `POST /invoice/getInvoiceStats` | `POST /invoice/getInvoiceStats` | No | Invoice stats |
| `PUT /invoice/addSubHeading` | `PUT /invoice/addSubHeading` | No | Add subheading |
| `PUT /invoice/toggle-payment-status` | `PUT /invoice/toggle-payment-status` | No | Toggle paid/unpaid |
| `PATCH /invoice/updateItemsNotes/:id` | `PATCH /invoice/updateItemsNotes/:id` | No | Update items |
| `POST /client/create` | `POST /client/create` | Yes | Create client |
| `PATCH /client/update/:id` | `PATCH /client/update/:id` | Yes | Update client |
| `POST /recipient/create` | `POST /recipient/create` | Yes | Create recipient |
| `PATCH /recipient/update/:id` | `PATCH /recipient/update/:id` | Yes | Update recipient |
| `POST /bankDetails/add` | `POST /bankDetails/add` | Yes | Add bank details |
| `PATCH /bankDetails/update/:id` | `PATCH /bankDetails/update/:id` | Yes | Update bank details |

#### Media Kit
| FE Call | BE Route | Auth | Purpose |
|---------|----------|------|---------|
| `POST /mediakit/link-mediakit-to-user` | `POST /mediakit/link-mediakit-to-user` | Yes | Link to user |
| `GET /mediakit/get-by-instaid/:id` | `GET /mediakit/get-by-instaId/:id` | No | Get by Instagram ID |
| `POST /mediakit/add-brand-collab` | `POST /mediakit/add-brand-collab` | No | Add collab |
| `PATCH /mediakit/update` | `PATCH /mediakit/update` | No | Update media kit |
| `POST /mediakit/analytics` | `POST /mediakit/analytics` | No | Upload analytics screenshot |
| `GET /mediakit/is-verified/:id` | `GET /mediakit/is-verified/:id` | No | Check verification |
| `PATCH /mediakit/update-brand-collab` | `PATCH /mediakit/update-brand-collab` | No | Update collab |
| `DELETE /mediakit/delete-brand-collab` | `DELETE /mediakit/delete-brand-collab` | No | Delete collab |
| `POST /mediakit/join-waitlist` | `POST /mediakit/join-waitlist` | Yes | Join waitlist |

#### Analytics
| FE Call | BE Route | Auth | Purpose |
|---------|----------|------|---------|
| `POST /analytics/page-view` | `POST /analytics/page-view` | No | Record page view |
| `POST /analytics/timeSpent` | `POST /analytics/timeSpent` | No | Record time spent |
| `POST /analytics/block-interaction` | `POST /analytics/block-interaction` | No | Record interaction |
| `GET /analytics/dodo-page/:id` | `GET /analytics/dodo-page/:id` | Yes | Get analytics data |

#### Content Generation
| FE Call | BE Route | Auth | Purpose |
|---------|----------|------|---------|
| `POST /content/generate` | `POST /content/generate` | Yes | AI content generation |

#### Coins/Rewards
| FE Call | BE Route | Auth | Purpose |
|---------|----------|------|---------|
| `GET /coins/user/:userId` | `GET /coins/user/:userId` | Yes | Get coin balance |
| `POST /coins/update` | `POST /coins/update` | Yes | Update coins |
| `POST /coins/redeem` | `POST /coins/redeem` | Yes | Redeem coins |

#### Publishing
| FE Call | BE Route | Auth | Purpose |
|---------|----------|------|---------|
| `POST /publish` | `POST /publish` | Yes | Publish dodo page |
| `GET /publish/:userId` | `GET /publish/:userId` | Yes | Get published state |

---

## Third-Party Integrations

### 1. Firebase (FE only)
- **Purpose:** Phone number authentication with OTP
- **Flow:** Phone → reCAPTCHA → OTP → Firebase UID → sent to BE
- **Config:** `dodofe/config/firebase.ts`
- **Env vars:** Hardcoded in config (API key, project ID, etc.)

### 2. AWS S3 (BE only)
- **Purpose:** Store uploaded files (profile pics, audio bios, block images, brand logos)
- **Bucket folders:** `dodo-profiles/`, `dodo-audio/`, `block-images/`, `brand-logos/`, `media-kit-profile-images/`
- **Upload flow:** Multer (in-memory) → S3 PutObject with public-read ACL
- **Config:** `dodobe/src/middleware/fileUpload.ts`
- **Env vars:** `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET_NAME`

### 3. Google Gemini AI (BE only)
- **Purpose:** (a) Content/script generation, (b) Parse Instagram analytics screenshots
- **Model:** Gemini 2.0 Flash
- **Config:** `dodobe/src/utils/geminiService.ts`
- **Env var:** `AI_API_KEY`

### 4. Mixpanel (FE only)
- **Purpose:** Product analytics, user behavior tracking
- **Initialized in:** `dodofe/app/layout.tsx`
- **Env var:** `NEXT_PUBLIC_MIXPANEL_ID`

### 5. Gmail SMTP (BE only)
- **Purpose:** Email notifications (admin alerts on waitlist signup)
- **Config:** `dodobe/src/utils/emailService.ts`
- **Env vars:** `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `ADMIN_EMAIL`

---

## Database Schema (MongoDB)

### Core Collections
| Collection | Key Fields | References |
|-----------|-----------|------------|
| **User** | name, mobileNumber, firebaseUid, email, dodoCoins | dodoPages[], invoices[], mediaKit |
| **DodoPage** | userId, name, url (unique), profilePicture, audioBio, socialLinks, thoughts | blocks[] |
| **Block** | dodoPageId, blockType (LINK/POLL/PRODUCT/HEADING/SEPARATOR), blockPositionalIndex, isActive | type-specific sub-doc |
| **Invoice** | userId, invoiceNumber, items, status (PAID/UNPAID), gst, tds, discount | bankDetail, recipient, client |
| **MediaKit** | instaId (unique), userId, isVerified, followers, engagement, brandCollabs, contentAnalytics | — |
| **PageView** | dodoPageId, visitorId, duration, device, browser, country | — |
| **BlockInteraction** | blockId, dodoPageId, visitorId, interactionType | — |
| **CoinTransaction** | userId, amount, transactionType (EARNED/REDEEMED), milestoneType | — |

---

## Frontend Structure (Key Paths)

```
dodofe/
├── api/
│   ├── constants.ts          # All endpoint URL constants
│   ├── interceptor.ts        # Axios instance + auth interceptors
│   └── services.ts           # API service functions
├── app/                      # Next.js app router
│   ├── login/                # Auth flow (phone → OTP → profile)
│   ├── home/                 # Dashboard
│   ├── dodo/[dodopageUrl]/   # Creator page editor
│   ├── links/                # Social links manager
│   ├── invoice/              # Invoice system
│   ├── media-kit/            # Creator portfolio
│   ├── coins/                # Rewards system
│   └── script-generator/     # AI content tool
├── store/slice/              # Redux slices (dodoPage, blocks, invoice)
├── components/               # atoms → molecules → templates
├── config/firebase.ts        # Firebase init
├── types/index.ts            # All TypeScript interfaces
└── utils/                    # Helpers, constants, localStorage
```

## Backend Structure (Key Paths)

```
dodobe/src/
├── app.ts                    # Express app, Swagger, middleware
├── config/
│   ├── index.ts              # Env config
│   └── database.ts           # MongoDB connection
├── routes/
│   ├── index.ts              # Router with /api/v1 prefix
│   ├── auth.ts, block.ts, dodoPage.ts, mediakit.ts, analytics.ts
│   └── invoiceRoutes/        # Invoice sub-routes
├── controllers/              # Business logic per domain
├── models/                   # Mongoose schemas per domain
├── middleware/
│   ├── auth.ts               # JWT verification
│   └── fileUpload.ts         # Multer + S3 upload
├── utils/
│   ├── emailService.ts       # Nodemailer
│   ├── geminiService.ts      # Google AI
│   ├── jwt.ts                # Token gen/verify
│   └── logger.ts             # Winston
└── test/                     # Jest test setup
```

---

## Environment Variables

### Frontend (.env)
| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_BACKEND_API_URL` | Backend API base URL (default: https://api.dodoclub.in/api/v1/) |
| `NEXT_PUBLIC_BASE_PATH` | Public site URL (https://dodoclub.in/) |
| `NEXT_PUBLIC_MIXPANEL_ID` | Mixpanel analytics token |
| `NEXT_PUBLIC_AI_API_KEY` | Google AI key (for FE features) |
| `NEXT_PUBLIC_ENV` | Environment flag (production/dev) |

### Backend (.env)
| Variable | Purpose |
|----------|---------|
| `PORT` | Server port (default: 3002) |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | JWT signing secret |
| `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET_NAME` | S3 file storage |
| `AI_API_KEY` | Google Gemini API key |
| `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `ADMIN_EMAIL` | SMTP email |

---

## Known Issues / Notes

1. **Dockerfile port mismatch** — Dockerfile exposes 3001, app defaults to 3002
2. **No rate limiting** on BE — consider express-rate-limit
3. **Some mediakit routes have auth commented out** — potential security gap
4. **No background job queue** — emails are synchronous (could block requests)
5. **Invoice routes are mostly unprotected** — no auth middleware on most invoice endpoints
6. **Hardcoded MongoDB URI** in database.ts — should be env-only
7. **FE strict mode OFF** in tsconfig — less type safety

---

## Quick Start (Local Dev)

```bash
# Backend
cd dodobe
cp .env.example .env  # fill in secrets
docker-compose up -d  # starts MongoDB + Mongo Express
pnpm install
pnpm dev              # runs on port 3002

# Frontend
cd dodofe
cp .env.example .env  # set NEXT_PUBLIC_BACKEND_API_URL=http://localhost:3002/api/v1/
pnpm install
pnpm dev              # runs on port 3000
```
