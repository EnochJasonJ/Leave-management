# Leave Management System (LMS) - Project Context

## Project Overview
This project is a **Comprehensive Leave Management System** designed for educational institutions. It provides a structured workflow for leave requests, approvals, and tracking across four primary roles: **Student, Staff, HOD, and Principal**.

### Core Functionality
- **Role-Based Dashboards:** Dynamic UI that adapts to the logged-in user's role.
- **Full Leave Lifecycle:** Real-time tracking from submission to approval/rejection.
- **Secure Authentication:** JWT-based session management with role-based access control (RBAC).
- **Assignment Tracking:** Integrated system for managing student tasks alongside leave requests.

## Technical Architecture

### Frontend (React + TypeScript)
- **Framework:** Vite + React 19
- **Styling:** Tailwind CSS 4 with Framer Motion for animations.
- **State & Context:** `AuthContext` for global session state.
- **API Communication:** Centralized Axios instance (`src/services/api.ts`) with automatic token injection.
- **Feedback:** `react-hot-toast` for user notifications.
- **Icons:** `lucide-react`.

### Backend (Node.js + Express + Prisma 7)
- **Language:** TypeScript with ESM support (`"type": "module"`).
- **Database:** MySQL managed via Prisma ORM 7.
- **Security:** Password hashing with `bcrypt` and JWT verification middleware.
- **Structure:** MVC-like pattern (Routes -> Controllers -> Prisma).
- **Logging:** `morgan` for development request logging.

## Getting Started

### Prerequisites
- Node.js (v20+)
- MySQL Database instance.

### Installation & Setup

1.  **Backend Setup:**
    ```bash
    cd backend
    npm install
    ```
    - Update `backend/.env` with your `DATABASE_URL` (e.g., `mysql://root:password@localhost:3306/mydb`).
    - Run the following commands to initialize the database:
    ```bash
    npx prisma generate
    npx prisma migrate dev --name init
    npx prisma db seed
    ```
    - Start the server:
    ```bash
    npm run dev
    ```

2.  **Frontend Setup:**
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

## Test Credentials
- **Student:** `enoch.jason@college.edu` / `password123`
- **Principal:** `principal@college.edu` / `principal123`

## Development Guidelines
- **Imports:** In the backend (ESM), always include the `.js` extension for local file imports (e.g., `import { x } from './y.js'`).
- **Middleware:** Use `authenticate` for all protected routes and `authorize(['ROLE'])` for role-restricted access.
- **API:** Use the `api` service in the frontend to ensure the `Authorization` header is managed correctly.
