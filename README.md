# Student Information Management System (SIMS)

A cloud-native Student Information Management System built using a **Three-Tier Cloud Architecture**.

---

## 🏛️ Three-Tier Cloud Architecture

```mermaid
graph TD
    Client["Client Browser"]
    
    subgraph PresentationTier["Tier 1: Presentation Tier (Hosting: Netlify)"]
        Frontend["React.js + Vite<br/>Single Page Application"]
    end
    
    subgraph LogicTier["Tier 2: Logic / Application Tier (Hosting: Render)"]
        Backend["Node.js + Express.js REST API<br/>CORS & Environment Validation<br/>Endpoints: /api/health, /api/*"]
    end
    
    subgraph DataTier["Tier 3: Data Tier (Cloud Database)"]
        Database[("MongoDB Atlas<br/>Managed Document Database<br/>Mongoose ODM")]
    end
    
    Client -->|HTTPS / UI Interactions| Frontend
    Frontend -->|REST API Requests / JSON| Backend
    Backend -->|Mongoose Connection Pool (TLS)| Database
```

| Tier | Component | Technology | Target Cloud Host |
| :--- | :--- | :--- | :--- |
| **Tier 1: Presentation** | Client User Interface | React.js (Vite), Modern Vanilla CSS | [Netlify](https://www.netlify.com/) |
| **Tier 2: Application / Logic** | RESTful Web Services | Node.js, Express.js, Mongoose, dotenv, cors | [Render](https://render.com/) |
| **Tier 3: Data** | Persistent Storage | MongoDB Atlas (Cloud Cluster) | [MongoDB Atlas](https://www.mongodb.com/atlas) |

---

## 📁 Project Directory Structure

```text
cloudp1/
├── .gitignore                    # Root gitignore (excludes secrets, node_modules, dist)
├── package.json                  # Root convenience scripts
├── README.md                     # Comprehensive architecture and setup guide
│
├── backend/                      # Tier 2: Application Tier
│   ├── .env.example              # Documented environment variables template
│   ├── .env                      # Local environment file (ignored by Git)
│   ├── .gitignore                # Backend-specific ignore rules
│   ├── package.json              # Backend dependencies and scripts
│   ├── src/
│   │   ├── app.js                # Express app setup (CORS, JSON parser, routes, error handlers)
│   │   ├── server.js             # Server entrypoint (connects DB before listening, graceful shutdown)
│   │   ├── config/
│   │   │   └── db.js             # MongoDB Atlas connection manager & URI validator
│   │   ├── controllers/
│   │   │   └── healthController.js # Health check logic (reports server uptime & DB status)
│   │   └── routes/
│   │       └── healthRoutes.js   # Route definitions for /api/health
│   └── tests/
│       └── health.test.js        # Automated tests (URI validation, 200 health check, 404 handler)
│
├── frontend/                     # Tier 1: Presentation Tier
│   ├── .env.example              # Frontend environment variables template
│   ├── .gitignore                # Frontend-specific ignore rules
│   ├── index.html                # Vite HTML entrypoint
│   ├── package.json              # Frontend dependencies and scripts
│   ├── vite.config.js            # Vite configuration
│   └── src/
│       ├── App.jsx               # Root React component
│       ├── main.jsx              # React DOM mounting
│       └── index.css             # Base styles
│
└── mcp-server/                   # Local Model Context Protocol (MCP) Server for Claude Desktop
    ├── package.json              # MCP dependencies (@modelcontextprotocol/sdk, zod, mongoose)
    ├── tsconfig.json             # TypeScript configuration
    ├── claude_desktop_config.json# Claude Desktop Windows config template
    ├── .env.example              # MCP environment template
    ├── src/                      # Source code (tools, schemas, db connection)
    └── dist/                     # Compiled production bundle
```

---

## ⚙️ Prerequisites

- **Node.js**: `v18.0.0` or higher (tested with `v24.11.1`)
- **npm**: `v9.0.0` or higher (tested with `v11.1.0`)
- **MongoDB**: A free **MongoDB Atlas** account (or local MongoDB for offline development)

---

## 🚀 Quickstart & Local Setup

### 1. Clone & Workspace Inspection
```bash
git clone <repository-url>
cd cloudp1
```

---

### 2. Backend Setup (Tier 2)

#### Step 2.1: Install Dependencies
```bash
cd backend
npm install
```

#### Step 2.2: Configure Environment Variables
Copy the example environment file:
```bash
cp .env.example .env
```

Open `backend/.env` and update the parameters:
```env
PORT=5000
NODE_ENV=development

# Replace placeholders with your actual MongoDB Atlas cluster credentials:
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/student_db?retryWrites=true&w=majority

# Or for local development with local MongoDB:
# MONGODB_URI=mongodb://127.0.0.1:27017/student_db

CORS_ORIGIN=http://localhost:5173
```

> [!WARNING]
> Never commit `.env` or hardcode database credentials in code. `.env` is listed in `.gitignore`.

#### Step 2.3: Run Automated Tests
Execute the automated test suite to verify URI validation, health endpoint responses, and error handling:
```bash
npm test
```

#### Step 2.4: Start the Backend Server
- **Development mode (with auto-reload):**
  ```bash
  npm run dev
  ```
- **Production mode:**
  ```bash
  npm start
  ```

Once running, verify the health endpoint:
```bash
curl http://localhost:5000/api/health
```

Expected JSON response:
```json
{
  "status": "UP",
  "service": "Student Information Management System - Backend API",
  "version": "1.0.0",
  "timestamp": "2026-10-15T12:58:27.169Z",
  "uptime": 21.26,
  "environment": "development",
  "database": {
    "status": "connected",
    "host": "cluster0.abcde.mongodb.net",
    "name": "student_db"
  }
}
```

---

### 3. Frontend Setup (Tier 1)

#### Step 3.1: Install Dependencies
```bash
cd ../frontend
npm install
```

#### Step 3.2: Configure Environment Variables
```bash
cp .env.example .env
```
Ensure `VITE_API_BASE_URL` points to your backend:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

#### Step 3.3: Start Frontend Dev Server
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## ☁️ Manual Cloud Setup Required

Before deploying to production, complete these manual steps:

### A. MongoDB Atlas (Data Tier)
1. Sign in to [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Create an **M0 (Free)** cluster.
3. Under **Security > Database Access**:
   - Create a database user with password authentication (e.g., `sims_admin`).
   - Grant the role **Read and write to any database**.
4. Under **Security > Network Access**:
   - Click **Add IP Address**.
   - For local development: click **Add Current IP Address**.
   - For Render cloud hosting: click **Allow Access From Anywhere** (`0.0.0.0/0`) because cloud hosting IP addresses are dynamic.
5. Under **Deployment > Database**:
   - Click **Connect** > **Drivers** (Node.js).
   - Copy the connection string format:
     `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/student_db?retryWrites=true&w=majority`
   - Paste it into your `backend/.env` (and Render environment variables).

---

### B. Render (Backend Hosting - Tier 2)
1. Sign up / Log in to [Render](https://render.com/).
2. Create a **New Web Service** connected to your Git repository.
3. Configure the service:
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/server.js`
4. Add **Environment Variables** in the Render Dashboard:
   - `NODE_ENV`: `production`
   - `PORT`: `10000` (or leave default assigned by Render)
   - `MONGODB_URI`: `<your-production-mongodb-atlas-uri>`
   - `CORS_ORIGIN`: `https://<your-frontend>.netlify.app`

---

### C. Netlify (Frontend Hosting - Tier 1)
1. Sign up / Log in to [Netlify](https://www.netlify.com/).
2. Click **Add new site > Import an existing project** from your Git repository.
3. Configure the build settings:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`
4. Add **Environment Variables** in the Netlify Dashboard:
   - `VITE_API_BASE_URL`: `https://<your-render-backend-url>/api`

---

## 📚 Student REST API Reference (Phase 2)

Base Path: `/api/students`

### Data Model (`Student`)

| Field | Type | Required | Constraints | Description |
| :--- | :--- | :--- | :--- | :--- |
| `studentId` | `String` | **Yes** | Unique, Alphanumeric (`/^[A-Za-z0-9-_]+$/`), uppercase | Unique institutional Student ID (e.g. `STU-1001`) |
| `name` | `String` | **Yes** | 2 - 100 characters, trimmed | Full name of student |
| `email` | `String` | **Yes** | Unique, valid email pattern, lowercase | Student email address |
| `department` | `String` | **Yes** | 2 - 50 characters, trimmed | Academic department (e.g. `Computer Science`) |
| `semester` | `Number` | **Yes** | Integer between `1` and `12` | Current enrolled semester |
| `contact` | `String` | No | Valid phone format (`7` to `15` digits) | Optional contact phone number |
| `createdAt` | `Date` | Auto | ISO 8601 Timestamp | Document creation timestamp |
| `updatedAt` | `Date` | Auto | ISO 8601 Timestamp | Document update timestamp |

---

### Endpoints Overview

| Method | Endpoint | Description | Status Codes |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/students` | Get paginated list of students with search & filters | `200`, `500` |
| `GET` | `/api/students/:id` | Get a single student by MongoDB `_id` | `200`, `400`, `404`, `500` |
| `POST` | `/api/students` | Create a new student | `201`, `400`, `409`, `500` |
| `PUT` | `/api/students/:id` | Update an existing student | `200`, `400`, `404`, `409`, `500` |
| `DELETE` | `/api/students/:id` | Delete a student record | `200`, `400`, `404`, `500` |

---

### Sample Requests & Responses

#### 1. Create a Student (`POST /api/students`)
**Request Body:**
```json
{
  "studentId": "STU-2026-001",
  "name": "Alex Mercer",
  "email": "alex.mercer@example.edu",
  "department": "Computer Science",
  "semester": 4,
  "contact": "+1-555-234-5678"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Student record created successfully.",
  "data": {
    "_id": "67a0a1b2c3d4e5f6a7b8c9d0",
    "studentId": "STU-2026-001",
    "name": "Alex Mercer",
    "email": "alex.mercer@example.edu",
    "department": "Computer Science",
    "semester": 4,
    "contact": "+1-555-234-5678",
    "createdAt": "2026-10-15T13:00:00.000Z",
    "updatedAt": "2026-10-15T13:00:00.000Z"
  }
}
```

**Conflict Error (409 Conflict):**
```json
{
  "success": false,
  "error": "Conflict",
  "message": "A student with studentId \"STU-2026-001\" already exists.",
  "field": "studentId",
  "value": "STU-2026-001"
}
```

---

#### 2. Get All Students (`GET /api/students`)
**Query Parameters (Optional):**
- `search`: Search across `studentId`, `name`, `department`, `email`
- `department`: Filter by department (e.g. `?department=Computer Science`)
- `semester`: Filter by semester (e.g. `?semester=4`)
- `page`: Page number (default: `1`)
- `limit`: Items per page (default: `20`, max: `100`)
- `sortBy`: Sort field (`createdAt`, `name`, `studentId`, `semester`, `department`)
- `order`: `asc` or `desc` (default: `desc`)

**Response (200 OK):**
```json
{
  "success": true,
  "count": 1,
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 20,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  },
  "data": [
    {
      "_id": "67a0a1b2c3d4e5f6a7b8c9d0",
      "studentId": "STU-2026-001",
      "name": "Alex Mercer",
      "email": "alex.mercer@example.edu",
      "department": "Computer Science",
      "semester": 4,
      "contact": "+1-555-234-5678",
      "createdAt": "2026-10-15T13:00:00.000Z",
      "updatedAt": "2026-10-15T13:00:00.000Z"
    }
  ]
}
```

---

#### 3. Get Student by ID (`GET /api/students/:id`)
**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "67a0a1b2c3d4e5f6a7b8c9d0",
    "studentId": "STU-2026-001",
    "name": "Alex Mercer",
    "email": "alex.mercer@example.edu",
    "department": "Computer Science",
    "semester": 4,
    "contact": "+1-555-234-5678"
  }
}
```

**Invalid ID Error (400 Bad Request):**
```json
{
  "success": false,
  "error": "InvalidId",
  "message": "Invalid identifier format: \"invalid-id\". Expected a valid 24-character hexadecimal MongoDB ObjectId."
}
```

**Not Found Error (404 Not Found):**
```json
{
  "success": false,
  "error": "NotFound",
  "message": "Student not found with ID \"507f1f77bcf86cd799439011\"."
}
```

---

#### 4. Update Student (`PUT /api/students/:id`)
**Request Body:**
```json
{
  "semester": 5,
  "contact": "+1-555-987-6543"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Student record updated successfully.",
  "data": {
    "_id": "67a0a1b2c3d4e5f6a7b8c9d0",
    "studentId": "STU-2026-001",
    "name": "Alex Mercer",
    "email": "alex.mercer@example.edu",
    "department": "Computer Science",
    "semester": 5,
    "contact": "+1-555-987-6543"
  }
}
```

---

#### 5. Delete Student (`DELETE /api/students/:id`)
**Response (200 OK):**
```json
{
  "success": true,
  "message": "Student record with ID \"STU-2026-001\" deleted successfully.",
  "data": {
    "id": "67a0a1b2c3d4e5f6a7b8c9d0",
    "studentId": "STU-2026-001",
    "name": "Alex Mercer"
  }
}
```

---

## 🧪 Verification Checklists

### Phase 1 Checklist (Foundation & Cloud Connectivity)
- [x] Clean project structure with isolated `backend/` and `frontend/` directories.
- [x] Node.js Express backend initialized with `express`, `mongoose`, `dotenv`, and `cors`.
- [x] Environment configuration with `.env` (credentials placeholder) and `.env.example`.
- [x] `.env` files protected and excluded in `.gitignore`.
- [x] Express server implemented with health check endpoint `GET /api/health`.
- [x] MongoDB Atlas connection configured via `MONGODB_URI` with Mongoose.
- [x] Server connects to MongoDB **before** starting HTTP listener; connection failures handled clearly with troubleshooting messages.
- [x] npm scripts added for development (`npm run dev`) and production (`npm start`).
- [x] Automated test suite verifying health endpoint and URI validation (`npm test`).
- [x] Frontend scaffolded with React + Vite and verified build (`npm run build`).

### Phase 2 Checklist (Student Models, Validations & CRUD APIs)
- [x] Created `models/Student.js` using Mongoose with required constraints and timestamps.
- [x] Fields: `studentId` (unique, uppercase), `name` (required), `email` (unique, valid pattern), `department` (required), `semester` (1-12 range), `contact` (optional, formatted).
- [x] Modular routes and controllers (`studentRoutes.js`, `studentController.js`).
- [x] Implemented `GET /api/students` (with search, department/semester filter, pagination, sorting).
- [x] Implemented `GET /api/students/:id` (fetch single student by MongoDB `_id`).
- [x] Implemented `POST /api/students` (create with validation and duplicate prevention).
- [x] Implemented `PUT /api/students/:id` (partial updates, validation, and conflict prevention).
- [x] Implemented `DELETE /api/students/:id` (delete record with validation).
- [x] Request body and MongoDB document ID validation middleware (`validateStudent.js`, `validateObjectId.js`).
- [x] Duplicate handling (`409 Conflict`), invalid inputs (`400 Bad Request`), missing records (`404 Not Found`).
- [x] Consistent JSON response structure with standard HTTP status codes.
- [x] Full automated integration test suite (`backend/tests/student.test.js`) passing 20/20 Phase 2 tests (26/26 total tests).
- [x] Documented sample requests, responses, and query parameters in README.
