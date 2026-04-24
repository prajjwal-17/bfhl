# BFHL Full Stack Challenge

A full-stack submission for the **SRM Full Stack Engineering Challenge** built with **Node.js**, **Express**, **React**, and **Vite**.

This project includes:

- A production-ready **REST API** with the required `POST /bfhl` endpoint
- A hosted **frontend UI** to interact with the API and inspect results visually
- Deployment-ready setup for:
  - **Backend** on Render
  - **Frontend** on Vercel
- A **GitHub Actions workflow** to ping the backend health endpoint periodically

## Live Links

- **Frontend URL**: `https://prajjwalrawat-fe-bfhl.vercel.app`

## Repository Structure

```text
bajaj/
├── backend/
│   ├── index.js
│   ├── package.json
│   └── node_modules/           # local only, not tracked
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   └── .gitignore
├── .github/
│   └── workflows/
│       └── healthcheck-ping.yml
└── README.md
```

## Tech Stack

### Backend

- Node.js
- Express
- CORS

### Frontend

- React
- Vite
- CSS

### Hosting

- Render for backend
- Vercel for frontend

## Backend

### Base URL

```text
https://prajjwalrawat-bfhl.onrender.com
```

### Endpoints

#### `GET /`

Basic server check.

Response:

```text
API running
```

#### `GET /health`

Health endpoint used for service checking and the keep-warm GitHub Actions workflow.

Response:

```json
{
  "status": "ok",
  "message": "API healthy"
}
```

#### `POST /bfhl`

Main challenge endpoint.

Request body:

```json
{
  "data": ["A->B", "A->C", "B->D"]
}
```

Response format:

```json
{
  "user_id": "prajjwalrawat_17112004",
  "email_id": "pr7553@srmist.edu.in",
  "college_roll_number": "RA2311026010224",
  "hierarchies": [
    {
      "root": "A",
      "tree": {
        "A": {
          "B": {
            "D": {}
          },
          "C": {}
        }
      },
      "depth": 3
    }
  ],
  "invalid_entries": [],
  "duplicate_edges": [],
  "summary": {
    "total_trees": 1,
    "total_cycles": 0,
    "largest_tree_root": "A"
  }
}
```

## Backend Features

### 1. Input Validation

Each input entry is trimmed and validated against the required format:

- valid pattern: `X->Y`
- `X` and `Y` must be single uppercase letters `A-Z`
- self-loops like `A->A` are invalid

Examples of invalid entries:

- `"hello"`
- `"1->2"`
- `"AB->C"`
- `"A-B"`
- `"A->"`
- `"A->A"`
- `""`

All invalid values are returned in:

```json
"invalid_entries": [...]
```

### 2. Duplicate Detection

If the same edge appears multiple times:

- first occurrence is used
- later occurrences are reported once in `duplicate_edges`

Example:

```json
["A->B", "A->B", "A->B"]
```

Produces:

```json
"duplicate_edges": ["A->B"]
```

### 3. Multi-Parent Rule

If a child gets more than one parent:

- first parent wins
- later parent edges are silently ignored

Example:

```json
["A->C", "B->C"]
```

Effective graph keeps only:

```text
A->C
```

### 4. Independent Graph Grouping

The backend detects separate graph groups and returns them independently in `hierarchies`.

### 5. Cycle Detection

If a group contains a cycle:

- `tree` becomes `{}`
- `has_cycle: true` is included
- `depth` is omitted

Example:

```json
{
  "root": "A",
  "tree": {},
  "has_cycle": true
}
```

For non-cyclic trees, `has_cycle` is omitted entirely to match the challenge specification.

### 6. Tree Construction

Valid non-cyclic groups are converted into nested tree objects.

Example:

```json
["A->B", "A->C", "B->D"]
```

Becomes:

```json
{
  "A": {
    "B": {
      "D": {}
    },
    "C": {}
  }
}
```

### 7. Depth Calculation

Depth is calculated as the number of nodes in the longest root-to-leaf path.

Example:

```text
A -> B -> C
```

Depth:

```text
3
```

### 8. Summary Generation

The API returns:

- total valid trees
- total cyclic groups
- largest tree root

Tiebreak rule for `largest_tree_root`:

- higher depth wins
- if equal depth, lexicographically smaller root wins

## Backend Functions

The backend is organized around these core functions:

- `validateInput()`
- `buildGraph()`
- `detectCycle()`
- `buildTree()`
- `calculateDepth()`

Additional helper logic is used for:

- connected component grouping
- invalid entry normalization
- summary generation

## How To Run Backend Locally

Go to the backend folder:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Start server:

```bash
npm start
```

or

```bash
node index.js
```

Default local URL:

```text
http://localhost:3000
```

### Test Backend Locally

Health check:

```bash
curl http://localhost:3000/health
```

BFHL request:

```bash
curl -X POST http://localhost:3000/bfhl \
  -H "Content-Type: application/json" \
  -d '{"data":["A->B","A->C","B->D"]}'
```

## Frontend

The frontend is a single-page React app that allows users to:

- enter JSON input payloads
- submit data to the hosted backend
- view API results in a readable UI
- inspect:
  - identity information
  - summary metrics
  - hierarchy tree cards
  - invalid entries
  - duplicate edges
  - raw JSON response
- see request resolution time
- see API failure messages if a request fails

## Frontend Features

- Clean single-page interface
- Tree-style rendering for hierarchy output
- Cycle indicator for cyclic graph groups
- Separate cards for:
  - user info
  - summary
  - invalid entries
  - duplicate edges
  - raw output
- Request time display in milliseconds
- Responsive layout suitable for desktop and mobile

## Frontend Configuration

The frontend reads the backend base URL from:

```env
VITE_API_BASE_URL
```

The UI does **not** expose the backend URL input. It uses the configured environment variable internally.

## How To Run Frontend Locally

Go to the frontend folder:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create a local env file:

```env
VITE_API_BASE_URL=http://localhost:3000
```

Start development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

## Frontend Environment Variables

Required:

```env
VITE_API_BASE_URL=https://prajjwalrawat-bfhl.onrender.com
```

Example local file:

Create:

```text
frontend/.env.local
```

With:

```env
VITE_API_BASE_URL=http://localhost:3000
```

## Deployment

### Backend Deployment (Render)

Settings used:

- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `npm start`
- Health Check Path: `/health`

### Frontend Deployment (Vercel)

Settings used:

- Framework Preset: `Vite`
- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`

Vercel environment variable:

```env
VITE_API_BASE_URL=https://prajjwalrawat-bfhl.onrender.com
```

## GitHub Actions Health Check

A workflow is included at:

```text
.github/workflows/healthcheck-ping.yml
```

It:

- runs every 10 minutes
- can also be triggered manually
- hits the backend health URL stored in a GitHub Actions secret

Required GitHub secret:

```text
BACKEND_HEALTHCHECK_URL
```

Example value:

```text
https://prajjwalrawat-bfhl.onrender.com/health
```

## Example Test Cases

### 1. Valid Tree

```json
{
  "data": ["A->B", "A->C", "B->D"]
}
```

### 2. Multiple Independent Trees

```json
{
  "data": ["A->B", "C->D", "D->E"]
}
```

### 3. Cycle

```json
{
  "data": ["A->B", "B->C", "C->A"]
}
```

### 4. Duplicate Edge

```json
{
  "data": ["A->B", "A->B", "B->C"]
}
```

### 5. Multi-Parent Child

```json
{
  "data": ["A->C", "B->C", "C->D"]
}
```

### 6. Invalid Mixed Input

```json
{
  "data": ["A->B", 123, null, true, { "edge": "B->C" }]
}
```

### 7. Combined Edge Case

```json
{
  "data": ["A->B", "A->B", "B->C", "D->C", "E->E", "X-Y", "  F->G  ", 123, null]
}
```

## Challenge Notes

- API accepts `application/json`
- API is CORS-enabled
- logic is dynamic, not hardcoded
- backend follows the challenge structure for:
  - trees
  - cycles
  - duplicates
  - invalid entries
  - depth
  - summary
- frontend is designed to make evaluator testing easier

## Submission Requirements Covered

This project is intended to satisfy the challenge submission requirements:

1. Hosted API base URL
2. Hosted frontend URL
3. Public GitHub repository URL

## Author

- **Name**: Prajjwal Rawat
- **Email**: `pr7553@srmist.edu.in`
- **College Roll Number**: `RA2311026010224`
