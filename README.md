# DHL DAC 3.0 Knowledge Base Automation

## 🚀 Overview
The **DHL DAC 3.0 Knowledge Base** is a specialized logistics feedback organization platform designed to transform unstructured feedback into a structured, interconnected intelligence hub. Built with industrial precision and DHL's corporate identity, it bridges the gap between raw data collection and strategic decision-making.

The system utilizes an **MVP (Model-View-Presenter)** architecture to ensure a clean separation of concerns, high performance, and full compatibility with UiPath RPA automation workflows.

---

## 🛠 Tech Stack
- **Backend:** Node.js, Express.js
- **Frontend:** Vanilla JavaScript (ES6+), HTML5, CSS3
- **Visualization:** SVG (Dynamic Orthogonal Routing)
- **Database:** Local JSON (File-based persistence)
- **Deployment:** Vercel-ready serverless configuration

---

## ✨ Key Features

### 1. Mind-Map Intelligence Visualization
- **Interconnected Nodes:** Automatically links feedback cards based on shared tags.
- **Logistics Route Mapping:** Uses SVG orthogonal (right-angled) connection lines to visualize the data flow, emulating a global logistics network.
- **Dynamic Highlights:** Hovering over a card instantly reveals all related intelligence nodes.

### 2. High-Attention "Focus View"
- **Deep Dive:** Expanding a card blurs the background to focus attention on critical data.
- **RPA Step Breakdown:** Visualizes the specific extraction steps taken by the UiPath robot (e.g., "Identify Postcode", "Validate Shipment ID").
- **Version History:** Comprehensive audit trail of all status changes and actions.

### 3. Professional Status Workflow & Access Control
- **Lifecycle Management:** Supports `Draft`, `Reviewed`, and `Published` statuses.
- **Role-Based Access (RBAC):**
  - **Guest:** View-only access to `Published` articles.
  - **Editor:** Full access to CRUD operations, status management, and manual uploads.
- **Visual Semiotics:** Status-specific glows and badges ensure immediate identification of article readiness.

### 4. RPA & Manual Data Integration
- **RESTful API:** Standardized JSON endpoints for seamless integration with UiPath robots.
- **Manual Upload Console:** Sleek drag-and-drop interface for editors to process `.txt`, `.pdf`, or `.docx` files via AI Transformation.
- **Duplicate Prevention:** 14-day cryptographic hash window prevents redundant data entry from RPA or manual sources.
- **AI Transformation:** Simulated GPT-4o analysis converts raw text into structured schema (Title, Summary, Steps, Tags).
- **Conflict Alerts:** Automated detection of overlapping SOPs based on shared tags (>= 2).

---

## 🏗 Architecture (MVP)
The project follows the **Model-View-Presenter** pattern:
- **Model ([model.js](public/js/model.js)):** Manages data state, API communication, role-based logic, and conflict detection.
- **View ([view.js](public/js/view.js)):** Handles DOM manipulation, SVG drawing, Modal management, and Auth UI updates.
- **Presenter ([presenter.js](public/js/presenter.js)):** Acts as the orchestrator, responding to user input, handling file uploads, and updating the application state.

---

## 🚦 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm

### Installation
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```

### Running Locally
Start the development server:
```bash
node server.js
```
The application will be available at `http://localhost:3004`.

---

## 📡 API Endpoints (Full CRUD - Rubric A5)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/articles` | Retrieve all knowledge base articles. |
| `POST` | `/api/content` | **RPA Endpoint:** Submit new feedback for analysis. |
| `POST` | `/api/upload` | **Manual Upload:** Accept file uploads for AI processing. |
| `PUT` | `/api/articles/:id` | **Update Node:** Modify status or content (Editor Only). |
| `DELETE` | `/api/articles/:id` | **Delete Node:** Remove outdated intelligence nodes (Editor Only). |
| `GET` | `/api/rpa/download` | Download the current UiPath `Main.xaml` workflow. |

---

## 🎨 Branding Standards
The interface strictly adheres to the **DHL Corporate Brand Guide**:
- **DHL Red:** `#D40511` (Primary actions, branding)
- **DHL Yellow:** `#FFCC00` (Highlights, warnings, focus states)
- **Background:** Deep "Coal" neutral (`#131313`) for professional dark-mode aesthetics.
- **Typography:** Inter (Systematic, highly legible).

---

## 📂 Project Structure
```text
├── public/
│   ├── js/
│   │   ├── model.js       # Data management & Auth logic
│   │   ├── view.js        # UI, Modals & SVG rendering
│   │   ├── presenter.js   # Logic orchestration & Upload handlers
│   │   └── app.js         # Bootstrap
│   ├── index.html         # Main interface & Modals
│   └── style.css          # DHL Dark Theme system
├── uploads/               # Storage for manual document uploads
├── rpa/
│   └── Main.xaml          # UiPath workflow source
├── server.js              # Express API server with Multer & AI Placeholder
├── database.json          # Persistent storage
└── vercel.json            # Deployment config
```

---
*Built for DHL DAC 3.0 - Logistics Intelligence Hub*
