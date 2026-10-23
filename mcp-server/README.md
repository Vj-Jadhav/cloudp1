# Student Information Management System - Local MCP Server

A high-performance, strictly validated **Model Context Protocol (MCP)** server connecting **Claude Desktop** directly to your **MongoDB Atlas** database via **Mongoose**.

---

## 🏛️ Architecture Overview

The system uses a direct Model Context Protocol stdio transport layer:

```
┌─────────────────┐       JSON-RPC (stdio)       ┌────────────────────────┐
│                 │ ───────────────────────────> │                        │
│ Claude Desktop  │                              │ Local MCP Server       │
│  (AI Assistant) │ <─────────────────────────── │ (Node.js / TypeScript) │
└─────────────────┘      Protocol Response       └───────────┬────────────┘
                                                             │
                                                        Mongoose ODM
                                                             │
                                                             ▼
                                                 ┌────────────────────────┐
                                                 │  MongoDB Atlas Cluster │
                                                 │     (Cloud Database)   │
                                                 └────────────────────────┘
```

- **Independent execution**: Operates in its own directory (`mcp-server/`) decoupled from Express backend and React frontend.
- **Protocol isolation**: Standard output (`stdout`) is strictly reserved for MCP JSON-RPC protocol frames. All application, diagnostic, and error logs are directed to `stderr` (`process.stderr`).
- **Security & Safety**:
  - Zero arbitrary query/code execution.
  - Server-side runtime validation using **Zod**.
  - Duplicate conflict detection before committing records.
  - Two-phase confirmation safety flow for student deletions.
  - Database credentials are completely masked from logs, tool responses, and Git.

---

## 🛠️ Implemented MCP Tools

The server registers exactly six dedicated tools:

| # | Tool Name | Description | Key Parameters |
|---|---|---|---|
| 1 | `list_students` | List students with filtering and pagination | `department`, `semester`, `search`, `limit`, `page` |
| 2 | `get_student` | Retrieve a student profile by student ID or MongoDB ObjectId | `studentId` (required) |
| 3 | `create_student` | Add a new validated student record to MongoDB Atlas | `studentId`, `name`, `email`, `department`, `semester`, `contact` |
| 4 | `update_student` | Update explicitly allowed fields of an existing student | `studentId` (required), `name`, `email`, `department`, `semester`, `contact`, `newStudentId` |
| 5 | `delete_student` | Permanently delete a student with required two-step confirmation | `studentId` (required), `confirm` (boolean), `confirmStudentId` (string) |
| 6 | `get_student_statistics` | Return enrollment counts, department stats, and semester distributions | `department` (optional) |

---

## 📁 Project Structure

```
d:\cloudp1\mcp-server\
├── package.json                   # Scripts and dependencies (@modelcontextprotocol/sdk, mongoose, zod)
├── tsconfig.json                  # TypeScript ES2022/NodeNext configuration
├── claude_desktop_config.json     # Windows Claude Desktop configuration snippet
├── .env.example                   # Environment variable template with placeholders
├── .env                           # Local connection secrets (gitignored)
├── .gitignore                     # Git ignore rules protecting .env and dist/
├── src/
│   ├── index.ts                   # Main server entry point (stdio transport, lifecycle)
│   ├── db/
│   │   ├── connection.ts          # MongoDB Atlas connection pool & URI validator
│   │   └── models/
│   │       └── Student.ts         # Mongoose schema matching backend Student collection
│   ├── schemas/
│   │   └── studentSchemas.ts      # Strict Zod schemas for all 6 tools
│   ├── tools/
│   │   ├── listStudents.ts        # list_students handler
│   │   ├── getStudent.ts          # get_student handler
│   │   ├── createStudent.ts       # create_student handler (duplicate checking)
│   │   ├── updateStudent.ts       # update_student handler (conflict safe)
│   │   ├── deleteStudent.ts       # delete_student handler (two-phase confirmation)
│   │   ├── studentStats.ts        # get_student_statistics handler (Atlas aggregation)
│   │   └── index.ts               # Tool registration pipeline
│   └── utils/
│       └── logger.ts              # Stderr-only logger with URI password masking
├── dist/                          # Compiled production JavaScript files
└── tests/
    └── test-tools.ts              # End-to-end verification test suite
```

---

## ⚙️ Prerequisites & Setup

### 1. Requirements
- **Node.js**: v18.0.0 or higher (v24.11.1 verified on Windows)
- **MongoDB Atlas Cluster**: Active connection URI
- **Claude Desktop for Windows**: Installed on your system

### 2. Environment Configuration
Create or verify your local `.env` inside `mcp-server/`:

```bash
# mcp-server/.env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/<database>?retryWrites=true&w=majority
```

> **Security Note:** Never commit `mcp-server/.env` to Git. It is already added to `.gitignore`. Only `mcp-server/.env.example` is tracked.

### 3. Install Dependencies & Build

From `mcp-server/`:
```powershell
npm install
npm run build
```

Or from the workspace root (`d:\cloudp1`):
```powershell
npm run mcp:install
npm run mcp:build
```

---

## 🧪 Testing & Verification

An automated verification suite tests all 6 tools against MongoDB Atlas:

```powershell
npm run mcp:test
```

### What the Test Suite Verifies:
1. **Database Connectivity**: Connects to your MongoDB Atlas cluster.
2. **`get_student_statistics`**: Aggregates total students and department breakdown.
3. **`create_student`**: Inserts a test student (`MCP-TEST-999`) and verifies the record in Atlas.
4. **Duplicate Prevention**: Attempts to recreate the same student ID and confirms a `409 Conflict` error is returned.
5. **`get_student`**: Fetches the profile by student ID.
6. **`update_student`**: Modifies the department and semester, and verifies changes.
7. **`list_students`**: Runs filtered search and confirms the updated record.
8. **`delete_student` Safety Flow**:
   - Calls `delete_student` with `confirm: false` and confirms the server issues `CONFIRMATION_REQUIRED` without deleting.
   - Verifies the student still exists in MongoDB.
   - Calls `delete_student` with `confirm: true` and `confirmStudentId: 'MCP-TEST-999'`.
   - Verifies MongoDB returns `deletedCount: 1` and confirms record removal.

---

## 💻 Claude Desktop Configuration (Windows)

Claude Desktop reads MCP configurations from:
```
%APPDATA%\Claude\claude_desktop_config.json
```
Full path:
```
C:\Users\<YourUsername>\AppData\Roaming\Claude\claude_desktop_config.json
```

### Step 1: Locate your Node.js Executable
In Windows PowerShell, run:
```powershell
where.exe node
```
Example output:
`C:\Program Files\nodejs\node.exe`

### Step 2: Locate your Entry-Point File
The compiled entry-point file is:
`D:\cloudp1\mcp-server\dist\index.js`

### Step 3: Edit or Create `claude_desktop_config.json`
Create or update `C:\Users\<YourUsername>\AppData\Roaming\Claude\claude_desktop_config.json` (replacing paths if your drive or username differ):

```json
{
  "mcpServers": {
    "student-information-system": {
      "command": "C:\\Program Files\\nodejs\\node.exe",
      "args": [
        "D:\\cloudp1\\mcp-server\\dist\\index.js"
      ],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

> **Note on Windows JSON Paths:** Always use double backslashes (`\\`) or forward slashes (`/`) in JSON strings so backslashes are not treated as escape characters.

### Step 4: Restart Claude Desktop
1. Exit Claude Desktop completely (Right-click Claude in system tray -> Quit).
2. Start Claude Desktop again.
3. Open a new chat. Look for the hammer icon (🛠️ / MCP tools) at the bottom right of the message box.
4. Verify that all 6 tools appear:
   - `list_students`
   - `get_student`
   - `create_student`
   - `update_student`
   - `delete_student`
   - `get_student_statistics`

---

## 🗣️ Example Natural Language Prompts for Claude Desktop

Once connected, you can converse naturally with Claude:

### 1. View Statistics
> *"Can you give me an overview of the current student population and department statistics?"*

### 2. List Students
> *"List all students currently enrolled in the Computer Science department in semester 3."*

### 3. Add a New Student
> *"Please add a new student with ID 'CS-2026-01', Name 'Grace Hopper', Email 'grace.hopper@univ.edu', Department 'Computer Science', Semester 4, and Contact '+1-555-0199'."*

### 4. Search & Retrieve
> *"Look up student profile for ID 'CS-2026-01'."*

### 5. Update Student Details
> *"Update Grace Hopper's semester to 5 and change her department to 'Artificial Intelligence'."*

### 6. Delete with Confirmation Flow
> *"Delete student 'CS-2026-01'."*
>
> **Claude's Safety Response:**
> Claude will invoke `delete_student`, receive the `CONFIRMATION_REQUIRED` challenge, and ask:
> *"Are you sure you want to permanently delete student 'CS-2026-01' (Grace Hopper)? This operation cannot be undone. Please confirm to proceed."*
>
> When you reply:
> *"Yes, I confirm the deletion of student 'CS-2026-01'."*
>
> Claude will re-invoke `delete_student` with `confirm: true` and `confirmStudentId: 'CS-2026-01'`, executing the permanent deletion and confirming MongoDB's response.

---

## 🔧 Troubleshooting

### 1. Tools do not appear in Claude Desktop
- **Check config path**: Ensure the configuration is saved at `%APPDATA%\Claude\claude_desktop_config.json`.
- **Restart Claude**: Fully quit and reopen Claude Desktop.
- **Check node path**: Verify `C:\Program Files\nodejs\node.exe` exists by running it in terminal.
- **Build files**: Ensure `D:\cloudp1\mcp-server\dist\index.js` exists. If not, run `npm run build` in `mcp-server/`.

### 2. "Database Configuration Error"
- Verify that `mcp-server/.env` exists and contains a valid `MONGODB_URI`.
- Test the connection directly by running `npm run test:tools` in `mcp-server/`.

### 3. "SyntaxError" or JSON-RPC protocol error
- Ensure no code writes to `console.log`. Only `logger` (which writes to `process.stderr`) is used for non-protocol output.

### 4. IP Whitelist Error in MongoDB Atlas
- In MongoDB Atlas dashboard -> Network Access -> ensure your current public IP address is allowed (or `0.0.0.0/0` for development).
