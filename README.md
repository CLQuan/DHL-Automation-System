# DHL DAC 3.0 Knowledge Base Automation

A DHL-branded knowledge base and RPA integration demo for transforming logistics feedback into structured, searchable intelligence nodes.

## What It Does
- Displays DHL feedback as connected knowledge cards.
- Shows related articles through SVG route-style connections.
- Provides a focus view with raw input, AI summary, tags, RPA steps, and version history.
- Supports `Draft`, `Reviewed`, and `Published` lifecycle states.
- Allows Editor users to upload text documents, update status, and delete nodes.
- Exposes an RPA-ready API for UiPath ingestion.

## Rubric Coverage
| Area | Implementation |
| :--- | :--- |
| UI/UX design | DHL color system, responsive layout, filters, focus view, and visual status badges. |
| CRUD operations | Create via upload/RPA, read article grid, update status/content, delete nodes. |
| API integration | Express endpoints for articles, upload, RPA content, health, and workflow download. |
| Process identification | Stored extraction steps, tags, raw input, summary, status, and audit history. |
| RPA logic | UiPath workflow includes duplicate checks, AI call, API submission, counters, and summary logging. |
| Error handling | API validation, duplicate prevention, upload limits, database write checks, and UiPath Try/Catch. |

## Tech Stack
- Node.js and Express.js
- Vanilla JavaScript with Model-View-Presenter structure
- HTML5 and CSS3
- Local JSON persistence
- UiPath `Main.xaml`
- Vercel configuration

## Run Locally
```bash
npm install
npm start
```

Open:

```text
http://localhost:3004
```

## API Endpoints
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | API readiness and article counts. |
| `GET` | `/api/articles` | Retrieve all knowledge base articles. |
| `POST` | `/api/content` | UiPath RPA ingestion endpoint. |
| `POST` | `/api/upload` | Manual text-based upload endpoint. |
| `PUT` | `/api/articles/:id` | Update article fields or status. |
| `DELETE` | `/api/articles/:id` | Delete an article. |
| `GET` | `/api/rpa/download` | Download the UiPath workflow. |

## RPA Endpoint
UiPath should post structured JSON to:

```text
http://localhost:3004/api/content
```

The endpoint validates required fields, rejects invalid status values, and returns `409` for duplicate content detected within the 14-day hash window.

## Project Structure
```text
public/
  index.html
  style.css
  js/
    app.js
    model.js
    presenter.js
    view.js
rpa/
  Main.xaml
  INSTRUCTIONS.txt
database.json
server.js
project_guide.md
UiPath_Setup_guide.md
vercel.json
```
