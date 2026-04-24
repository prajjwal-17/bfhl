# BFHL Full Stack Challenge

A full-stack submission for the **SRM Full Stack Engineering Challenge**.

This project includes:

- A **Node.js + Express REST API** with the required `POST /bfhl` endpoint
- A **frontend client** to test and visualize API responses
- Deployment-ready setup for:
  - **Backend** on Render
  - **Frontend** on Vercel
- A GitHub Actions workflow to ping the backend health endpoint periodically

## Live Links

- **Frontend URL**: `https://prajjwalrawat-fe-bfhl.vercel.app`

## Repository Structure

```text
bajaj/
├── backend/
│   ├── index.js
│   ├── package.json
│   └── node_modules/   (not tracked)
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   └── .gitignore
└── .github/
    └── workflows/
        └── healthcheck-ping.yml
