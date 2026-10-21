# 🌌 Nexora — Official ISE Club Web Platform

<div align="center">


**Department of Information Science and Engineering**  
*A J Institute of Engineering and Technology (AJIET), Kottara Chowki, Mangaluru*  
*(A Unit of Laxmi Memorial Educational Trust® • NBA Accredited B.E. Program)*

[Public Portal](#-public-features) • [Admin CMS](#-enterprise-admin-dashboard) • [Architecture](#-technology-stack) • [Getting Started](#-getting-started) • [API Routes](#-api-reference)

---

</div>

## 📌 Overview

**Nexora** is the flagship digital ecosystem of the Information Science and Engineering (ISE) department student club at AJIET. Designed with a **Clean Minimal + Cyber Neon SaaS** aesthetic, the platform unifies student collaboration, academic resources, event registrations, and administrative content management into a fast, mobile-first web application.

The project features a **public community portal** for students and visitors, alongside an **enterprise-grade administrative CMS** with granular role-based permissions, real-time database persistence on Supabase PostgreSQL, and automated audit logging.

---

## ✨ Features

### 🌐 Public Portal

- **Interactive Cyber Hero:**
  - Modern typography powered by Jersey 10 and Geist fonts.
  - Showcases the department and club collaboration (*Nexora X Heka*).
  - Emphasizes the core pillars: **THINK • BUILD • INNOVATE**.
  - Quick action links for events and academic materials.

- **Events & Hackathons Hub (`/events`):**
  - Event track categorization (*Hackathons, Technical Competitions, Workshops, Seminars*).
  - Past vs. Upcoming event filtering.
  - Rich event details modal with date, venue, eligibility, and tags.
  - Live student registration modal with real-time feedback.

- **Achievement Gallery (`/achievements`):**
  - Showcases state-level and national hackathon victories (e.g., Smart India Hackathon, InCTF).
  - Verified achievement cards with staggered intersection-observer animations.

- **Academic & Skill Portal (`/learn`):**
  - Semester-wise study materials, lab manuals, and VTU question papers.
  - Upcoming internal and semester exam schedules with live countdown badges.
  - Hands-on skill tracks across Full-Stack, Cloud, DSA, and Open Source.

- **Department Profile (`/about`):**
  - Overview of the NBA-accredited B.E. program established in 2016.
  - Formal Vision & Mission statements.
  - HOD Desk message and department photo gallery.
  - Comprehensive directory of professors, lecturers, and technical staff.

- **Cyber 404 Error Experience (`/_not-found`):**
  - Custom canvas-based `<FuzzyText />` component featuring dynamic pixel displacement.
  - Interactive mouse hover intensity shifts, click-burst effects, and periodic glitch spikes.

### 🤝 Nexora Connect (Backend API)

- Admin-managed USN/name roster with create, read, update, deactivate, and full-roster replacement.
- Signup lookup returns the official roster name for an available USN; member profile creation uses that server-side name.
- Invalid, inactive, or already-claimed USNs are rejected with the Connect support contact.
- Google OAuth sign-in and signup, member sessions, sign-out, pending profile approval, and self-service portfolio and knowledge-page APIs.
- Public directory responses include only approved, public profiles and respect contact visibility settings.
- Admin APIs support profile review, report/dispute triage, and audited roster changes.
- Responsive member directory, public profiles, roster-verified signup, member workspace, portfolio editor, and knowledge-page editor.

---

### 🛡️ Enterprise Admin Dashboard (`/admin`)

- **Secure Authentication & Session Management:**
  - JWT-based authentication using bcrypt-hashed password verification.
  - Secure, HTTP-Only session cookies with automated session invalidation.
  - Super Admin and Role delegation architecture (`SUPER_ADMIN`, `ADMIN`, `EDITOR`).

- **Unified Control Panel:**
  - **Overview Analytics:** Real-time metrics for events, achievements, learning resources, and drafts.
  - **Events Manager:** Create, update, publish, or archive hackathons and technical symposiums.
  - **Achievements CMS:** Add and update student competition milestones.
  - **Learning Hub Manager:** Upload notes, past exam papers, and syllabus updates.
  - **Category Taxonomies:** Dynamic category assignment across events and resources.
  - **Admin User Management:** Manage admin credentials, assign roles, and view last login activity.
  - **Audit Logs:** Immutable audit trail recording every create, update, and delete action with actor ID and timestamp.
  - **Active Sessions:** Monitor active administrator login sessions.

---

## 🛠 Technology Stack

| Layer | Technologies | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | [Next.js 16.4.0](https://nextjs.org/) (App Router, Turbopack) | High-performance server rendering & client navigation |
| **UI Library** | [React 19.3.0](https://react.dev/) | Modern concurrent UI component tree |
| **Styling & Design** | [Tailwind CSS v4](https://tailwindcss.com/) | Cyberpunk dark theme & enterprise light dashboard |
| **Database & ORM** | [Prisma 7.10](https://www.prisma.io/) & [PostgreSQL](https://www.postgresql.org/) | Type-safe queries via `@prisma/adapter-pg` driver |
| **Cloud Database** | [Supabase](https://supabase.com/) | Hosted PostgreSQL, pooling, and asset storage |
| **Authentication** | Supabase Auth for Connect members; bcrypt + JWT for administrators | Verified member sessions and administrator credentials |
| **Smooth Scrolling** | [Lenis 1.3](https://lenis.darkroom.engineering/) | Hardware-accelerated inertial smooth scroll |
| **Visuals & Icons** | [Lucide React](https://lucide.dev/), HTML5 Canvas, Three.js | Scalable SVG icons and generative canvas animations |
| **Runtime & Tooling** | [Bun](https://bun.sh/) / [Node.js](https://nodejs.org/) (v20+) | Fast package execution and build lifecycle |

---

## 📂 Project Structure

```text
Nexora-Website/
├── app/                              # Next.js App Router
│   ├── about/                        # Department profile & faculty directory
│   ├── achievements/                 # Hackathons & milestones gallery
│   ├── admin/                        # Enterprise admin portal & login
│   ├── api/                          # Serverless API routes
│   │   ├── achievements/             # Public & admin achievements endpoints
│   │   ├── admin/                    # Auth, audit logs, sessions, users, CMS
│   │   ├── connect/                   # Member, roster lookup, directory, reports, disputes
│   │   ├── events/                   # Events retrieval & submission endpoints
│   │   └── resources/                # Academic resources & materials
│   ├── events/                       # Technical events, hackathons & registration
│   ├── learn/                        # Study materials, VTU exams, skill tracks
│   ├── globals.css                   # Tailwind CSS v4 styling & mobile reset
│   ├── layout.tsx                    # Root layout with fonts & smooth scroll
│   ├── not-found.tsx                 # Interactive 404 FuzzyText experience
│   └── page.tsx                      # Public landing page (Hero section)
├── components/                       # Modular UI components
│   ├── admin/                        # Admin layout, sidebar, header & CMS views
│   │   └── views/                    # Dashboard, Events, Users, Logs
│   ├── events/                       # Event cards, hero, filters, and modal
│   ├── learn/                        # Academic cards, countdowns, exam lists
│   ├── AchievementGallery.tsx        # Milestone cards with scroll observer
│   ├── Footer.tsx                    # Responsive department footer
│   ├── FuzzyText.tsx                 # React Bits HTML5 canvas fuzz displacement
│   ├── Hero.tsx                      # Landing hero & club collaboration
│   ├── Navbar.tsx                    # Responsive floating pill navigation
├── lib/                              # Core backend utilities & data layer
│   ├── admin-auth.ts                 # JWT generation, verification & cookies
│   ├── events-data.ts                # Event filtering logic & initial datasets
│   ├── prisma.ts                     # Prisma client singleton with PG adapter
│   ├── supabase.ts                   # Supabase client initialization
│   └── types.ts                      # Shared TypeScript data models
├── prisma/                           # Database schema & migrations
│   └── schema.prisma                 # PostgreSQL database schema definition
├── public/                           # Static public media, logos, and fonts
└── .gitignore                        # Git ignore rules (includes agent configs)
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have installed:
- [Node.js](https://nodejs.org/) (version `20.x` or higher)
- [Bun](https://bun.sh/) (recommended) or `npm` / `pnpm`
- A [Supabase](https://supabase.com/) PostgreSQL database project

### 1. Clone the Repository

```bash
git clone https://github.com/NexoraIse/Nexora-Website.git
cd Nexora-Website
```

### 2. Install Dependencies

```bash
bun install
# or
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Database Connections (Supabase PostgreSQL)
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# Supabase Public API Keys
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT_REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Admin Security Secret
ADMIN_JWT_SECRET="super-secure-random-secret-key-for-nexora-admin"

# Separate server-only key for Connect USN lookup rate limiting
CONNECT_LOOKUP_HMAC_SECRET="generate-a-separate-random-secret-with-at-least-32-characters"

# Canonical origin used for Connect auth callbacks (HTTPS in production)
CONNECT_APP_URL="http://localhost:3000"
```

### 4. Sync Database Schema

Generate the Prisma Client and apply checked-in migrations to your PostgreSQL instance:

```bash
bunx prisma generate
bunx prisma migrate deploy
```

### 5. Start the Development Server

```bash
bun dev
# or
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🗄️ Database Schema Overview

The relational PostgreSQL schema in `prisma/schema.prisma` models all core entities:

- **`Admin` (`admins`):** System administrators with bcrypt-hashed credentials and roles (`SUPER_ADMIN`, `ADMIN`, `EDITOR`).
- **`Event` (`events`):** Department hackathons, workshops, and competitions with dates, venues, status, and registration links.
- **`Achievement` (`achievements`):** Student hackathon achievements, awards, and event recognitions.
- **`LearningResource` (`learning_resources`):** Semester-indexed study notes, VTU previous question papers, and lab manuals.
- **`Category` (`categories`):** Taxonomies across events and academic resources.
- **`AuditLog` (`audit_logs`):** Immutable log entries recording administrative updates, creations, and deletions.
- **`AdminSession` (`admin_sessions`):** Active user sessions with IP and user-agent tracking.
- **Nexora Connect:** Official USN list, reserved signup records, moderated member profiles, portfolio content, knowledge pages, reports, and requests for help.

---

## 📡 API Reference

### Public API Routes

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/events` | `GET` | Fetches all published upcoming and past events |
| `/api/achievements` | `GET` | Retrieves verified student achievements and awards |
| `/api/resources` | `GET` | Retrieves study notes, exam papers, and learning links |

### Nexora Connect API Routes

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/connect/auth/google` | `GET` | Starts Google OAuth for new and existing Connect members |
| `/api/connect/auth/sign-out` | `POST` | Ends the member session |
| `/api/connect/auth/session` | `GET` | Returns safe session and profile approval status |
| `/api/connect/auth/callback` | `GET` | Completes Google OAuth |
| `/api/connect/verify-usn` | `GET` | Rate-limited signup lookup; returns the official name for an available USN |
| `/api/connect/me` | `GET`, `POST`, `PATCH` | Read/create/update the authenticated member profile and portfolio |
| `/api/connect/me/knowledge` | `GET`, `PUT` | Manage a private draft and published knowledge page |
| `/api/connect/members` | `GET` | Search and paginate approved, public profiles |
| `/api/connect/members/[slug]` | `GET` | Fetch one public profile without identity or private contact fields |
| `/api/connect/reports` | `GET`, `POST` | Submit and track profile or knowledge-page reports |
| `/api/connect/disputes` | `GET`, `POST` | Submit and track USN claim disputes |
| `/api/admin/connect/roster` | `GET`, `POST`, `PUT`, `DELETE` | Super-admin CRUD for USN/name entries; `DELETE` deactivates an entry |
| `/api/admin/connect/accounts` | `GET`, `PATCH` | List registered Connect accounts and their profiles; super-admins can disable or restore access without deleting member data |
| `/api/admin/connect/profiles` | `GET`, `PATCH` | Review, approve, reject, or suspend member profiles |
| `/api/admin/connect/reports` | `GET`, `PATCH` | Triage reports and record resolutions |
| `/api/admin/connect/disputes` | `GET`, `PATCH` | Triage USN disputes and record resolutions |

`GET /api/connect/verify-usn?usn=...` responds with `{ "valid": true, "fullName": "..." }` for an active, unclaimed USN. Invalid or claimed entries include `nexora.ise@ajiet.edu.in` in the error. USN lookups are limited to 10 per client IP per 15 minutes; only a scoped HMAC of the IP is stored. Configure a unique server-only `CONNECT_LOOKUP_HMAC_SECRET` of at least 32 characters, set the canonical `CONNECT_APP_URL` (HTTPS in production), and ensure the hosting proxy sets a trusted `x-real-ip` header.

Roster bulk imports use `{ "entries": [{ "usn": "...", "fullName": "..." }], "replace": false }`. Use `replace: true` only with the complete authoritative roster; omitted USNs are deactivated and associated profiles suspended.
Connect signup and sign-in use Google OAuth. In Supabase Dashboard → Authentication → Providers, enable Google and add the Google OAuth client ID and secret. In Google Cloud, set the authorized redirect URI to the Supabase project's callback URL shown in the Google provider settings. Add `${CONNECT_APP_URL}/api/connect/auth/callback` to Supabase's Auth redirect URL allowlist. After Google signs in, new members verify their USN against the active department roster before creating a profile; the server checks it again and stores the official name. Connect does not support email/password authentication.

Connect account administration also requires the Supabase service-role key as the server-only `SUPABASE_SERVICE_ROLE_KEY` environment variable. Never expose it to the browser or commit it. The Registered Members screen combines Supabase Auth accounts (including unconfirmed signups) with their Nexora Connect profiles; super administrators can disable or restore access while preserving member data.

Connect profile photo uploads use Cloudinary. Create a Cloudinary account, then set the server-only `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` environment variables in local `.env` and the deployment environment. Never expose the API secret in a `NEXT_PUBLIC_` variable or commit it. Verified Connect members can upload JPG, PNG, or WebP images up to 5 MB; uploads are resized to 800 × 800 and stored in the Cloudinary `nexora/connect-profiles/<member-id>` folder. The uploaded photo is applied to the profile when the member saves it.

### Nexora Connect Pages

- `/connect` — searchable directory of approved, public members.
- `/connect/sign-up` — Google account signup followed by official roster USN verification and profile setup.
- `/connect/sign-in` — Google sign-in for existing members.
- `/connect/dashboard` — create and manage a profile, portfolio, privacy and contact settings, plus a Markdown personal page for experiences, achievements, advice, and links. Members can start from an optional template, save private drafts, and publish the page on their public profile after approval.
- `/connect/knowledge` — direct access to the same personal Markdown page editor.
- `/connect/activity` — submit and follow up on profile reports and USN disputes.
- `/connect/members/[slug]` — public member portfolio.
- `/admin/connect/moderation` — administrator review queues for profiles, reports and USN disputes.
- `/admin/connect/roster` — super-administrator management of the official USN roster.

### Administrative API Routes (Protected)

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/admin/login` | `POST` | Authenticates administrator and sets secure HTTP-only JWT cookie |
| `/api/admin/logout` | `POST` | Clears administrator authentication cookie |
| `/api/admin/session` | `GET` | Validates session token and returns current admin profile |
| `/api/admin/dashboard` | `GET` | Aggregates live metrics and counts for the dashboard overview |
| `/api/admin/events` | `GET`, `POST`, `PUT`, `DELETE` | Full CRUD operations for department events |
| `/api/admin/achievements`| `GET`, `POST`, `PUT`, `DELETE` | Full CRUD operations for student achievement gallery |
| `/api/admin/resources` | `GET`, `POST`, `PUT`, `DELETE` | Full CRUD operations for academic study materials |
| `/api/admin/users` | `GET`, `POST`, `PUT`, `DELETE` | Super Admin management of administrative user accounts |
| `/api/admin/audit-logs` | `GET` | Retrieves security and action audit logs |

---

## 📱 Mobile Responsiveness & Performance

- **Fluid Layouts:** Uses responsive flexbox, CSS grids, and Tailwind breakpoints (`sm`, `md`, `lg`, `xl`).
- **Floating Pill Navigation:** Persists across scroll states with dynamic backdrop blur and an accessible touch-drawer menu.
- **Horizontal Overflow Guards:** Configured global CSS rules (`overflow-x: hidden`, `max-width: 100vw`) to eliminate unwanted viewport panning.
- **Turbopack Optimized:** Bundles and renders efficiently with Next.js 16 Partial Prefetching and Cache Components.

---

## 🧑‍💻 Contributing

1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'feat: Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📄 License & Attribution

Designed and maintained by the **Nexora Club* Information Science and Engineering ** at **A J Institute of Engineering and Technology (AJIET)**, Mangaluru.

All rights reserved © 2026 Nexora ISE Club.
