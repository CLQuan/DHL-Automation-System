# DHL DAC 3.0 Knowledge Base Automation

## Overview
The DHL DAC 3.0 Knowledge Base is a logistics feedback platform that turns unstructured operational feedback into searchable, connected knowledge nodes. It combines a Node.js API, a vanilla JavaScript MVP front end, and a UiPath RPA workflow for automated ingestion.

## Rubric Alignment
- UI/UX design: DHL-branded dark interface, responsive layout, status badges, filters, focus view, and SVG relationship routes.
- CRUD operations: create through manual upload or RPA import, read article cards, update lifecycle status, and delete outdated nodes.
- API integration: REST endpoints for the web app and UiPath robot, including `/api/content`, `/api/articles`, `/api/upload`, and `/api/health`.
- Process identification: each article stores extraction steps, tags, status, raw input, and version history.
- RPA logic: UiPath workflow downloads source files, checks duplicates, calls AI transformation, and posts structured JSON to the API.
- Error handling: API validation, duplicate detection, upload restrictions, database write checks, and RPA Try/Catch logging.

## Tech Stack
- Backend: Node.js, Express.js
- Frontend: HTML5, CSS3, vanilla JavaScript
- Architecture: Model-View-Presenter
- Storage: local `database.json`
- Automation: UiPath `Main.xaml`
- Deployment: Vercel-ready configuration

## Main Features
1. Mind-map visualization links articles with shared tags using SVG orthogonal routes.
2. Focus view shows raw input, AI summary, RPA process steps, tags, and audit history.
3. Status workflow supports `Draft`, `Reviewed`, and `Published`.
4. Editor mode enables manual upload, status update, and delete operations.
5. RPA endpoint accepts structured JSON from UiPath and prevents recent duplicates.
6. Health endpoint confirms API readiness for demo and troubleshooting.

## API Endpoints
| Method | Endpoint | Purpose |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Check API status, article count, and RPA endpoint readiness. |
| `GET` | `/api/articles` | Retrieve all knowledge base articles. |
| `POST` | `/api/content` | RPA endpoint for structured article ingestion. |
| `POST` | `/api/upload` | Manual text-based document upload. |
| `PUT` | `/api/articles/:id` | Update an article, including status lifecycle changes. |
| `DELETE` | `/api/articles/:id` | Delete an outdated or duplicate article. |
| `GET` | `/api/rpa/download` | Download the UiPath workflow file. |

## Local Run
```bash
npm install
npm start
```

The application runs at `http://localhost:3004`.
