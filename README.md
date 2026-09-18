# AstroEngine — Enterprise Vedic & Western Astrology API Suite & SaaS Platform

A high-performance, multi-language (i18n) B2B Astrological calculation infrastructure, white-label PDF generation engine, and full-stack Next.js SaaS developer portal with live wallet billing, API key governance, and real-time administrative telemetry.

---

## 📚 Complete Project Documentation Index

All system specifications, deployment procedures, API guides, and module trackers are organized in the following documents:

| Document | Description | Direct Link |
| :--- | :--- | :--- |
| **Technical Specification** | Architecture, MySQL schema, caching policies, security rules, and full system design. | [TECHNICAL_SPECIFICATION.md](./TECHNICAL_SPECIFICATION.md) |
| **API Documentation** | Detailed reference for 117+ REST endpoints, schemas, authentication, and HTTP status codes. | [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) |
| **Installation & Deployment** | Step-by-step setup guide for Windows, Linux VPS, Python virtual environments, and Node services. | [INSTALLATION_GUIDE.md](./INSTALLATION_GUIDE.md) |
| **Backend Progress Tracker** | Live test results (38/38 test suites passed), endpoint coverage, and implementation status. | [BACKEND_PROGRESS.md](./BACKEND_PROGRESS.md) |

---

## 🚀 Key Highlights & Capabilities

### 1. Multi-Language Vedic & Western Astrology Engine (117+ Endpoints)
- **High-Precision Ephemeris**: Swiss Ephemeris (`pyswisseph`) C-bindings for sub-arcsecond planetary accuracy, Ayanamsas (Lahiri, Raman, KP, Fagan-Bradley), and house cusps.
- **6 Supported Languages (`i18n`)**: English (`en`), Hindi (`hi`), Gujarati (`gu`), Marathi (`mr`), Tamil (`ta`), and Telugu (`te`).
- **12 Specialized Calculation Modules**:
  1. Core Astronomy & Geolocation (`/api/v1/core`)
  2. Panchang & Muhurat (`/api/v1/panchang`)
  3. Parashari Kundli & Divisional Charts (`/api/v1/parashari`)
  4. Planetary Strengths / Shadbala & Ashtakavarga (`/api/v1/strengths`)
  5. Dasha Systems (`/api/v1/dasha`) — Vimshottari, Yogini, Char
  6. Dosha & Matchmaking / Ashtakoota (`/api/v1/dosha`, `/api/v1/matching`)
  7. Lal Kitab (`/api/v1/lalkitab`) — Debts, Farman, Teva
  8. Western Astrology (`/api/v1/western`) — Synastry, Progressions, Transits
  9. KP System (`/api/v1/kp`) — Ruling Planets, Cuspal Sub-Lords
  10. Numerology & Name Analysis (`/api/v1/numerology`)
  11. Astrological Remedies (`/api/v1/remedies`) — Gemstones, Rudraksha, Mantras
  12. Advanced Transits & Varshphal (`/api/v1/advanced`)

### 2. White-Label Async PDF Engine
- Asynchronous PDF generation queue using Jinja2 templates, SVG chart rendering, and WeasyPrint.
- Cloudflare R2 object storage integration with automatic 24-hour retention lifecycle.
- Fully customizable agency branding (custom logos, colors, agency headers).

### 3. Full-Stack Developer & Admin SaaS Portal
- **Developer Console**: API key lifecycle (SHA-256 hashed storage, `ak_live_` prefixes), live API telemetry streaming, wallet balance recharge via Razorpay checkout, and GST-compliant tax invoices (PDF/CSV).
- **Dual Plan Upgrades**: Support for plan purchases via live prepaid wallet balance deduction or direct Razorpay payment gateway checkout.
- **Admin Management Suite**:
  - Live financial auditing (`/admin/billing`) with live gross revenue and settled transaction reconciliation.
  - Tenant and user control (`/admin/users`) with credit injection, quota upgrades, and immutable audit logs.
  - Real-time API traffic monitor (`/admin/traffic`) and PDF job queue watcher (`/admin/pdf-queue`).
  - Centralized database configuration (`/admin/settings`) and developer support ticket desk (`/admin/support`).

---

## 🛠️ Tech Stack

- **Backend Gateway**: Python 3.11, FastAPI, Pydantic v2, Swiss Ephemeris (`pyswisseph`), Jinja2, WeasyPrint.
- **Frontend Portal**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons.
- **Database & ORM**: MySQL (`astroengine_db`), Prisma ORM.
- **Caching & Rate Limiting**: Upstash Redis / Serverless Redis.
- **Storage & CDN**: Cloudflare R2 (S3-compatible API).
- **Payment Processing**: Razorpay Orders & Webhook HMAC-SHA256 signature verification.

---

## ⚡ Quick Start (Local Setup)

### 1. Run Backend Engine (FastAPI)
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
- Interactive Swagger UI: `http://localhost:8000/docs`
- Interactive ReDoc: `http://localhost:8000/redoc`

### 2. Run Frontend Portal (Next.js)
```powershell
cd frontend
npm install
npx prisma db push
npm run dev
```
- SaaS Portal: `http://localhost:3000`
- Admin Dashboard: `http://localhost:3000/admin`

---

## 📄 License & Attribution
Proprietary Enterprise Software. Engineered for high-load B2B astrology applications.
