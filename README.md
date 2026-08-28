# 🚀 Enterprise Tracking Application

An enterprise-grade, high-performance issue, task, and project tracking platform built as a modern, commercial alternative to Jira, ClickUp, and ServiceNow. Features a glassmorphism UI, real-time WebSocket capabilities, role-based access control (RBAC), custom dynamic fields, and CSV data integration.

---

## 🌟 Overview & Key Features

### 1. 👥 Users & Access Control
- **Role-Based Access Control (RBAC)**: Support for `SUPER_ADMIN`, `ADMIN`, `EMPLOYEE`, plus dynamic **Custom Roles** with granular permissions.
- **Employee Identification**: Auto-generated Employee IDs (`TRA0001` format) for every employee.
- **Circular Display Picture (DP)**: Circular user avatar display picture (`rounded-full`) with upload support.
- **Live Online / Offline Status**: Real-time activity monitoring displaying live active users.
- **CSV Data Integration**:
  - **Export CSV**: Instant export of filtered user directory data to `.csv` files.
  - **Import CSV**: Bulk user account creation directly from CSV spreadsheets.
  - **Sample Template**: One-click download of `Users_Import_Template.csv` for standardized batch onboarding.

### 2. 🎯 User Account Profile
- Personal information management (First Name, Last Name, Email, Phone Number).
- Employee ID badge with one-click clipboard copy.
- Dynamic Display Picture (DP) uploader with live preview and circular avatar styling.

### 3. 🏢 Department Groups & Membership
- Group management with member role assignments (`LEAD`, `MEMBER`).
- Group-level ticket visibility and access control.

### 4. 🎫 Issue & Ticket Management System
- **Multiple Views**:
  - **Kanban Board**: Drag-and-drop workflow progression (`BACKLOG` ➔ `TODO` ➔ `IN_PROGRESS` ➔ `IN_REVIEW` ➔ `DONE` ➔ `CANCELLED`).
  - **AG Grid Datatable**: Enterprise table with multi-column sorting, filtering, and export.
  - **Compact List View**: Streamlined operational list layout.
- **Ticket Attributes**: Priorities (`URGENT`, `HIGH`, `MEDIUM`, `LOW`), tags, estimated vs logged work hours, assignees, reporters, and attachments.
- **Comments & Activity Stream**: Real-time comments and ticket state updates.

### 5. 🧩 Dynamic Form Builder
- Custom dynamic field creation per project/department (Text, Number, Select Dropdown, Date, Checkbox, Textarea).
- Validation rules and dynamic field rendering within ticket creation and editing forms.

### 6. 🛡️ Custom Roles & Permission Matrix
- Create dynamic custom roles (e.g., `QA Lead`, `Security Auditor`, `DevOps Specialist`).
- Fine-grained permission assignments per module (Read, Create, Edit, Delete, Admin access).

### 7. 📈 Interactive Analytics & Metrics Dashboard
- Executive KPI dashboard showing ticket counts by status, priority breakdown, SLA metrics, and recent team activity.
- Visual charts powered by Recharts.

### 8. 📜 System Audit Logs & History
- Comprehensive audit trail recording all security actions, user state modifications, role re-assignments, and ticket updates with timestamps.

---

## 🛠️ Technology Stack & Architecture

### Backend (Python / Django)
- **Core Framework**: Python 3.11+, Django 4.2+
- **REST API**: Django REST Framework (DRF), `drf-spectacular` (OpenAPI 3 schema)
- **Authentication**: `rest_framework_simplejwt` (JSON Web Tokens)
- **ASGI & WebSockets**: Django Channels, Daphne
- **Database**: PostgreSQL 16 (with SQLite fallback)
- **Storage**: Cloudinary Storage (for media/avatars) & WhiteNoise (for static assets)

### Frontend (React / TypeScript / Vite)
- **Core Framework**: React 18, TypeScript 5
- **Build Tool**: Vite 5
- **State Management**: Redux Toolkit & React Query (`@tanstack/react-query`)
- **UI Design System**: Modern Glassmorphism layout using TailwindCSS, Lucide Icons, and Framer Motion
- **Data Grids & Analytics**: AG Grid React (`ag-grid-react`), Recharts

---

## 📁 Repository Structure

```text
Tracking-Application/
├── backend/
│   ├── apps/
│   │   ├── audit_logs/       # Audit trail tracking
│   │   ├── comments/         # Ticket comments API
│   │   ├── dynamic_fields/   # Dynamic form field models
│   │   ├── groups_app/       # Department groups API
│   │   ├── notifications/    # System notifications
│   │   ├── projects/         # Project workspaces
│   │   ├── search/           # Global search handler
│   │   ├── tickets/          # Core ticket management
│   │   └── users/            # Authentication & user profiles
│   ├── tracking_core/        # Django settings, URLs, ASGI/WSGI
│   ├── create_admin.py       # Production superuser initializer
│   ├── seed_data.py          # Database seeder script
│   ├── manage.py             # Django CLI runner
│   └── requirements.txt      # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── api/              # Axios HTTP client configuration
│   │   ├── components/       # UI layout, header, Kanban, AG Grid
│   │   ├── pages/            # Dashboard, Tickets, Users, Profile, etc.
│   │   ├── store/            # Redux store & authentication slices
│   │   └── types/            # TypeScript interfaces & types
│   ├── package.json          # Node.js dependencies
│   ├── vite.config.ts        # Vite dev server & proxy settings
│   └── tailwind.config.js    # Tailwind styling tokens
├── render.yaml               # Cloud Render deployment blueprint
└── README.md                 # Project documentation
```

---

## 🚀 Quick Launch Guide

### Prerequisites
- **Python**: `v3.11` or higher
- **Node.js**: `v18.x` or higher
- **PostgreSQL**: (Optional, falls back automatically to SQLite if database is not configured)

---

### Step 1: Start the Backend Server

```bash
# 1. Navigate to backend directory
cd backend

# 2. Install Python dependencies
pip install -r requirements.txt

# 3. Apply database migrations
python manage.py migrate

# 4. Initialize Superuser ('admin' / 'admin123')
python create_admin.py

# 5. Launch ASGI Django Backend Server (Port 8000)
python manage.py runserver 0.0.0.0:8000
```

---

### Step 2: Start the Frontend Server

```bash
# 1. Open a new terminal and navigate to frontend directory
cd frontend

# 2. Install Node modules
npm install

# 3. Launch Vite Dev Server (Port 3000)
cmd.exe /c npm run dev
```

---

### Step 3: Access the Application

- **Frontend App**: Open [http://localhost:3000](http://localhost:3000) in your browser.
- **Backend REST API**: Available at [http://localhost:8000/api/](http://localhost:8000/api/)
- **API Documentation**: Open [http://localhost:8000/api/schema/swagger-ui/](http://localhost:8000/api/schema/swagger-ui/)

#### Default Administrator Credentials
- **Username**: `admin`
- **Password**: `admin123`

---

## 📊 CSV Import Specification

When importing users via CSV on the **Users & Access** page (`http://localhost:3000/users`), your CSV file can contain the following columns:

```csv
Username,Email,Password,First Name,Last Name,Role
john_dev,john@enterprise.com,UserPass123!,John,Dev,EMPLOYEE
sarah_admin,sarah@enterprise.com,UserPass123!,Sarah,Admin,ADMIN
```

> **Note**: You can click the **Spreadsheet icon** next to **Import CSV** on the Users & Access page to download `Users_Import_Template.csv` as a ready-to-use template.

---

## ☁️ Production Deployment (Render)

This repository includes a [`render.yaml`](file:///d:/antigravitygithu/Tracking-Application/render.yaml) file configured for deployment on Render:
1. **Web Service 1**: Django ASGI application served via `daphne`.
2. **Web Service 2**: Vite React SPA static frontend.
3. **Database Service**: Managed PostgreSQL 16 database instance.

To deploy, connect this repository to your Render account and deploy via **Blueprints**.

---

## 🔒 Security & Project Rules

- **Clean Production Database Policy**: Default demo role accounts (`manager`, `techlead`, `john_dev`, `sarah_qa`) and demo groups are omitted by default. Only explicitly created users and the default superadmin (`admin`) exist in the database.
- **JWT Protection**: All REST API endpoints enforce Bearer JWT authentication and strict permission policies.
