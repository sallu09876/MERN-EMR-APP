# EMR Appointment System

A **production-ready Electronic Medical Record (EMR) Appointment Scheduling System** built with the MERN stack. Implements JWT authentication, role-based access control, dynamic slot generation, concurrency-safe booking, audit logging, and full appointment lifecycle management.

---

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Setup & Installation](#setup--installation)
- [Docker Setup](#docker-setup)
- [Environment Variables](#environment-variables)
- [Seeding the Super Admin](#seeding-the-super-admin)
- [API Documentation](#api-documentation)
- [Role Permissions](#role-permissions)
- [Slot Generation Logic](#slot-generation-logic)
- [Concurrency & Double-Booking Prevention](#concurrency--double-booking-prevention)
- [Performance Optimizations](#performance-optimizations)
- [Security Measures](#security-measures)
- [Deployment](#deployment)

---

## Features

| Feature | Details |
|---------|---------|
| **JWT Auth** | Access token (15 min) + Refresh token (7 days, HTTP-only cookie) |
| **RBAC** | Super Admin, Doctor, Receptionist with enforced middleware |
| **Slot Generation** | Dynamic from doctor schedule, break excluded, past slots blocked |
| **Department Filter** | Filter doctors by department on scheduler |
| **Booking** | New or existing patient, search by name/mobile/ID |
| **Concurrency** | MongoDB unique compound index prevents double-booking |
| **Appointment CRUD** | Create, view, edit (purpose/notes/status), delete, mark arrived |
| **Audit Logging** | Login, create, update, delete, arrived — all stored in DB |
| **Pagination** | All list APIs support page/limit |
| **Input Validation** | Joi schemas on all mutation endpoints |
| **Security** | Helmet, CORS, rate limiting, bcrypt, HTTP-only cookies |
| **Docker** | Full docker-compose setup with MongoDB + Nginx |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TailwindCSS |
| Backend | Node.js 20, Express 5 |
| Database | MongoDB Atlas / Docker Mongo 7, Mongoose |
| Auth | JWT (jsonwebtoken), bcryptjs |
| Validation | Joi |
| Security | Helmet, express-rate-limit, CORS |
| Containerisation | Docker, Docker Compose, Nginx |

---

## Architecture

```
┌─────────────────────────────────┐
│  React + Vite (port 5173/3000)  │
│  Axios + auto token refresh     │
└────────────┬────────────────────┘
             │ HTTP / REST
┌────────────▼────────────────────┐
│  Express API (port 5000)        │
│  authMiddleware → roleMiddleware│
│  → controllers → services       │
└────────────┬────────────────────┘
             │ Mongoose ODM
┌────────────▼────────────────────┐
│  MongoDB                        │
│  users / doctors / patients     │
│  appointments / logs            │
└─────────────────────────────────┘
```

---

## Project Structure

```
emr-fixed/
├── docker-compose.yml
├── README.md
│
├── Server/
│   ├── Dockerfile
│   ├── server.js
│   ├── .env.example
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── doctorController.js
│   │   ├── patientController.js
│   │   ├── appointmentController.js
│   │   ├── adminController.js
│   │   └── userController.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   ├── roleMiddleware.js
│   │   ├── errorMiddleware.js
│   │   └── validateMiddleware.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Doctor.js
│   │   ├── Patient.js
│   │   ├── Appointment.js
│   │   ├── Receptionist.js
│   │   └── Log.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── doctorRoutes.js
│   │   ├── patientRoutes.js
│   │   ├── appointmentRoutes.js
│   │   ├── slotRoutes.js
│   │   └── adminRoutes.js
│   ├── services/
│   │   ├── slotService.js
│   │   └── logService.js
│   ├── utils/
│   │   ├── slotGenerator.js
│   │   ├── tokenUtils.js
│   │   └── createAdmin.js
│   └── validations/
│       └── appointmentValidation.js
│
└── Client/
    ├── Dockerfile
    ├── nginx.conf
    ├── .env.example
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── components/
        │   ├── Navbar.jsx
        │   ├── ProtectedRoute.jsx
        │   ├── RoleRoute.jsx
        │   ├── SlotGrid.jsx
        │   ├── AppointmentForm.jsx
        │   ├── Loader.jsx
        │   └── ErrorMessage.jsx
        ├── context/
        │   └── AuthContext.jsx
        ├── hooks/
        │   ├── useAppointments.js
        │   └── useDoctors.js
        ├── pages/
        │   ├── LoginPage.jsx
        │   ├── AdminDashboard.jsx
        │   ├── DoctorDashboard.jsx
        │   ├── ReceptionistDashboard.jsx
        │   ├── SchedulerPage.jsx
        │   ├── BookingPage.jsx
        │   ├── AppointmentListPage.jsx
        │   └── admin/
        │       ├── DoctorsPage.jsx
        │       ├── ReceptionistsPage.jsx
        │       └── SystemStatsPage.jsx
        ├── routes/
        │   └── AppRoutes.jsx
        ├── services/
        │   └── api.js
        └── utils/
            └── formatTime.js
```

---

## Setup & Installation

### Prerequisites
- Node.js ≥ 18
- MongoDB Atlas URI (or Docker for local MongoDB)

### 1. Clone & extract

```bash
cd emr-fixed
```

### 2. Backend

```bash
cd Server
npm install
cp .env.example .env   # fill in your values
npm run seed:admin     # create Super Admin (run once)
npm run dev            # starts on http://localhost:5000
```

### 3. Frontend

```bash
cd Client
npm install
cp .env.example .env
npm run dev            # starts on http://localhost:5173
```

---

## Docker Setup

Make sure Docker and Docker Compose are installed.

```bash
# From project root
cp Server/.env.example .env   # fill MONGO_URI, JWT secrets
docker-compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000 |
| MongoDB | localhost:27017 |

To seed the admin inside Docker:

```bash
docker exec -it emr-server node utils/createAdmin.js
```

---

## Environment Variables

### Server/.env

```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/emr-db
JWT_ACCESS_SECRET=your_64_char_random_secret
JWT_REFRESH_SECRET=your_different_64_char_secret
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173
```

### Client/.env

```env
VITE_API_URL=http://localhost:5000
```

---

## Seeding the Super Admin

Run once after setting up the database:

```bash
cd Server
npm run seed:admin
```

Credentials:
- **Email:** `superadmin@emr.com`
- **Password:** `Admin@1234`

---

## API Documentation

### Auth

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/login` | Login → returns accessToken + sets cookie | — |
| POST | `/api/auth/refresh` | Get new access token via refresh cookie | — |
| POST | `/api/auth/logout` | Clear refresh token cookie | — |

### Doctors

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/api/doctors` | List doctors (optional `?department=`) | All |
| POST | `/api/doctors` | Create doctor + user account | SUPER_ADMIN |
| PUT | `/api/doctors/:id` | Update doctor schedule | SUPER_ADMIN |
| DELETE | `/api/doctors/:id` | Delete doctor + user | SUPER_ADMIN |

### Slots

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/api/slots?doctorId=&date=` | Get available/booked slots | All |

### Appointments

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/api/appointments` | Book appointment | RECEPTIONIST, SUPER_ADMIN |
| GET | `/api/appointments` | List (filtered by role) | All |
| PUT | `/api/appointments/:id` | Edit purpose/notes/status | RECEPTIONIST, SUPER_ADMIN |
| DELETE | `/api/appointments/:id` | Delete | RECEPTIONIST, SUPER_ADMIN |
| POST | `/api/appointments/:id/arrive` | Mark arrived | RECEPTIONIST, SUPER_ADMIN |

### Patients

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/api/patients` | Create patient | All |
| GET | `/api/patients/search?query=` | Search by name/mobile/ID | All |

### Admin

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/api/admin/receptionists` | List receptionists | SUPER_ADMIN |
| POST | `/api/admin/receptionists` | Create receptionist | SUPER_ADMIN |
| PUT | `/api/admin/receptionists/:id` | Update receptionist | SUPER_ADMIN |
| DELETE | `/api/admin/receptionists/:id` | Delete receptionist | SUPER_ADMIN |
| GET | `/api/admin/stats` | System statistics | SUPER_ADMIN |

---

## Role Permissions

| Feature | Super Admin | Receptionist | Doctor |
|---------|:-----------:|:------------:|:------:|
| Login | ✅ | ✅ | ✅ |
| Manage Doctors | ✅ | — | — |
| Manage Receptionists | ✅ | — | — |
| System Stats | ✅ | — | — |
| Scheduler (all doctors) | ✅ | ✅ | — |
| Book Appointment | ✅ | ✅ | — |
| View All Appointments | ✅ | ✅ | — |
| Edit / Delete Appointment | ✅ | ✅ | — |
| Mark Patient Arrived | ✅ | ✅ | — |
| View Own Appointments | ✅ | ✅ | ✅ |

---

## Slot Generation Logic

File: `Server/utils/slotGenerator.js`

```
Input:
  workingHoursStart: "09:00"
  workingHoursEnd:   "17:00"
  slotDuration:      30 minutes
  breakStart:        "13:00"
  breakEnd:          "14:00"

Output slots:
  09:00–09:30, 09:30–10:00, ..., 12:30–13:00
  [break excluded]
  14:00–14:30, ..., 16:30–17:00
```

Rules enforced:
- No overlapping slots
- Break window fully excluded
- Past slots marked as BOOKED (not selectable)
- Date picker has `min=today` to prevent past date selection

---

## Concurrency & Double-Booking Prevention

The `Appointment` model uses a **MongoDB unique compound index**:

```js
appointmentSchema.index(
  { doctorId: 1, appointmentDate: 1, slotStartTime: 1 },
  { unique: true }
);
```

If two users simultaneously book the same slot, MongoDB throws `E11000 duplicate key error`. The backend catches error code `11000` and returns `409 Conflict`. This is atomic and requires no application-level locking.

---

## Performance Optimizations

### Backend
- `Promise.all()` for parallel DB queries (appointments + count in one round trip)
- MongoDB indexes: `doctorId`, `appointmentDate`, `patientId`, `timestamp`
- Compound unique index on `doctorId + appointmentDate + slotStartTime`
- Pagination on all list endpoints (`page`, `limit`)
- Role-based query filtering (doctors only see their own data)
- `select("-password")` to avoid loading sensitive fields unnecessarily

### Frontend
- `useCallback` and `useMemo` for stable references and derived data
- Custom hooks (`useAppointments`, `useDoctors`) to separate data logic from UI
- Axios interceptor for automatic token refresh — no per-component retry logic
- Department filtering computed client-side from loaded doctors (no extra API call)
- `min` attribute on date inputs to prevent invalid selections before API call

---

## Security Measures

- **Helmet** — Sets 11 secure HTTP headers
- **CORS** — Restricted to `CLIENT_ORIGIN` env variable only
- **Rate Limiting** — 100 requests / 15 min per IP on all `/api/*` routes
- **JWT** — Short-lived access tokens (15 min), refresh tokens in HTTP-only cookie (JS-inaccessible)
- **bcrypt** — Password hashing with salt rounds = 10, via Mongoose pre-save hook
- **Joi** — Input validated and sanitized before any DB operation
- **RBAC middleware** — Every route double-checked at middleware level, not just frontend
- **NoSQL injection** — Prevented by Mongoose schema typing + Joi validation

---

## Deployment

### Manual (VPS / Cloud)

```bash
# Backend
cd Server
NODE_ENV=production npm start

# Frontend — build and serve with nginx/caddy
cd Client
npm run build
# serve /dist with your web server
```

### Docker (Recommended)

```bash
docker-compose up -d --build
```
