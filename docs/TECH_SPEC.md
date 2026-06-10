# ZapCruise Back-Office — Technical Specification

**Version:** 1.0  
**Projects:** `zap-cruise-admin` (UI) · `zap-cruise-backend` (`/api/admin/*`)  
**Constraint:** Customer apps (`zap-cruise-Client`, public APIs) remain unchanged in behavior.

---

## 1. Architecture

```
┌─────────────────────┐     JWT (User.role=ADMIN)      ┌──────────────────────────┐
│  zap-cruise-admin   │ ─────────────────────────────► │  zap-cruise-backend      │
│  Next.js 16 (3002)  │     /api/admin/*               │  Express + Prisma        │
└─────────────────────┘                                │  ┌────────────────────┐  │
                                                       │  │ admin/ (isolated)  │  │
┌─────────────────────┐     telemetry (optional)     │  └────────────────────┘  │
│  zap-cruise-Client  │ ─────────────────────────────► │  /api/auth, /search, …   │
└─────────────────────┘                                └──────────┬─────────────┘
                                                                    │
                                                       PostgreSQL + Redis + BullMQ
```

| Layer | Responsibility |
|--------|----------------|
| **Admin UI** | RBAC-aware dashboards, no customer bundle |
| **Admin API** | `/api/admin/*` only; `authenticate` + `requirePermission` |
| **Telemetry** | `SearchLog`, `PageView`, `ConversionEvent` (additive tables) |
| **ETL/Workers** | Existing pipelines; admin reads queues + `EtlRunLog` |

---

## 2. Folder structure

### Backend (`zap-cruise-backend/src/admin/`)

```
admin/
├── index.js                 # Mounts all admin sub-routers
├── middleware/
│   ├── adminAuth.js         # RBAC permissions
│   └── auditLogger.js       # Post-success audit writes
├── routes/                  # adminUserRoutes, adminAnalyticsRoutes, …
├── controllers/
├── services/
└── utils/exportUtils.js
```

### Frontend (`zap-cruise-admin/`)

```
src/
├── api/api.ts, admin.ts
├── app/(dashboard)/         # Feature pages
├── components/layout/
├── lib/permissions.ts
└── store/authStore.ts
```

---

## 3. Database (additive Prisma models)

| Model | Purpose |
|--------|---------|
| `AdminProfile` | Links `User` → `AdminRole` (SUPER_ADMIN … READ_ONLY) |
| `UserStatus` | Suspension / quota audit trail |
| `AdminAuditLog` | Admin action governance |
| `SearchLog` | Search analytics |
| `PageView` | DAU/MAU |
| `ConversionEvent` | Funnel steps |
| `AdminNotification` | ETL/scraper/system alerts |
| `EtlRunLog` | ETL run history |
| `DataQualitySnapshot` | Freshness / orphan metrics |
| `PriceAnomaly` | Detected pricing outliers |

Migration: `20260604194639_add_admin_models`

---

## 4. RBAC

| Role | Typical access |
|------|----------------|
| SUPER_ADMIN | All + RBAC management |
| ADMIN | Users, catalog, analytics, ETL |
| ANALYST | Read analytics/export |
| OPERATIONS | ETL queues, system health |
| SUPPORT | Users suspend/quota/reset |
| READ_ONLY | Dashboards view-only |

Permissions defined in `admin/middleware/adminAuth.js` and mirrored in `zap-cruise-admin/src/lib/permissions.ts`.

---

## 5. Admin API map

| Prefix | Module |
|--------|--------|
| `/api/admin/rbac` | Profile, role assignment |
| `/api/admin/users` | List, detail, suspend, quota, password reset |
| `/api/admin/analytics` | Overview, affiliate, search, funnel, conversion, OTA, destinations |
| `/api/admin/catalog` | Cruises, sailings, ships, OTAs, port tokens, cruise lines |
| `/api/admin/pricing` | History, anomalies, seasonal, booking window, drops |
| `/api/admin/etl` | Queues, failed jobs, retry, ETL runs, data quality |
| `/api/admin/intelligence` | Popularity, routes, cruise line performance |
| `/api/admin/insights` | Phase 6 heuristic recommendations |
| `/api/admin/notifications` | Admin alerts inbox |
| `/api/admin/export` | CSV exports (affiliate, search, users) |
| `/api/admin/audit` | Audit log query |
| `/api/admin/system` | Health (DB, Redis, PM2) |

---

## 6. Feature classification

| Feature | Classification |
|---------|----------------|
| JWT login | **Reuse** `/api/auth/login` |
| Affiliate stats | **Extend** `affiliateClickService` + admin analytics |
| Cruise/ship CRUD | **Extend** existing Prisma models via `/admin/catalog` |
| Price history charts | **Reuse** `priceHistoryService` via `/admin/pricing` |
| User list (legacy) | **Reuse** pattern; **Extend** `/admin/users` |
| Search NLP | **Reuse** `cruiseSearch`; **Extend** with `SearchLog` on GET `/api/search` |
| ETL/scrapers | **Reuse** BullMQ; **Extend** admin queue introspection |
| RBAC, audit, telemetry tables | **Build new** |
| Admin UI app | **Build new** `zap-cruise-admin` |
| Funnel, intelligence, insights | **Build new** admin services |
| LLM predictive models | **Build new** (Phase 6 placeholder → future OpenAI) |

---

## 7. Phased implementation roadmap

### Phase 1 — Core admin platform ✅
- `zap-cruise-admin` app, login, dashboard, system health, audit viewer, RBAC page
- `/api/admin` router, `AdminProfile` seeder

### Phase 2 — User management ✅
- `/admin/users` list, detail, suspend, quota, password reset (via `authService`)

### Phase 3 — Analytics & reporting ✅
- Telemetry tables + `/api/telemetry`
- Search logging on public search route (non-blocking)
- Analytics: overview, affiliate breakdown, funnel, conversion, OTA, destinations

### Phase 4 — Pricing intelligence ✅
- `/admin/pricing/*` dashboards in UI
- Anomaly detection (Z-score query + `PriceAnomaly` table)

### Phase 5 — ETL & operations ✅
- Queue status, failed job retry, ETL runs, data quality snapshot
- Operations UI page

### Phase 6 — Advanced insights ✅ (heuristic v1)
- `/admin/insights/*` demand forecast, booking window, ops recommendations
- Upgrade path: replace heuristics with LLM batch jobs

---

## 8. Deployment notes

1. Run migration: `npm run db:migrate` in backend  
2. Seed admin: `npm run db:seed` → `admin@example.com` / `password123` (SUPER_ADMIN)  
3. Add admin origin to `CORS_ORIGIN` (e.g. `http://localhost:3002`)  
4. Admin UI: `NEXT_PUBLIC_API_URL=http://localhost:3001/api`  
5. Login requires `User.role = ADMIN` **and** `AdminProfile` row  

---

## 9. Security gaps (follow-up)

- Block `role: ADMIN` on public `POST /api/auth/register`
- Protect `/api/scrape/*` with API key or admin-only gateway
- Attach `userId` to affiliate redirect when authenticated
- Persist ETL failures → `AdminNotification` automatically (cron hook)

---

## 10. Customer impact statement

No changes to response shapes of public cruise/search/auth endpoints. Search route adds async logging only. All admin routes are net-new under `/api/admin`.
