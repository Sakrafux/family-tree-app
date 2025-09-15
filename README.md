# Family Tree Web Application

This project is a **web application for visualizing and managing family trees**, designed with a minimal but powerful 
stack. It combines a **Go backend** with an **embedded graph database** and a **React + D3.js frontend** for interactive 
visualization.

---

## Backend

The backend is implemented in **vanilla Go**, without any third-party web frameworks. Its main responsibilities include:

- Exposing APIs for managing family members, relationships, and metadata.
- Persisting data in two embedded databases:
  - **KuzuDB** -- used for storing and querying graph data (family relationships). The graph is stored as a local 
    file, providing lightweight and efficient graph operations.
  - **SQLite** -- used for traditional relational data persistence (e.g., user accounts, settings, or auxiliary metadata).

This design ensures a **lightweight, self-contained server** with no external database dependencies.

---

## Frontend

The frontend is built with **TypeScript + React**, powered by **Vite.js** for fast development and builds.

Key aspects: 
- **React** is used in its plain form (no SSR, no Next.js), since the app is a **static-generated SPA**.
- **D3.js** powers the rendering and interaction of the family tree, providing smooth zooming, panning, and 
  relationship visualization.
- The UI focuses on clarity and interactivity while remaining lightweight.

---

## Deployment

Deployment is designed to be simple and containerized:

1.  **Build the frontend bundle**:

    ``` bash
    cd frontend
    npm install
    npm run build
    ```

    This generates a static bundle that can be served by the Go backend.

2.  **Start the application with Docker Compose**:

    ``` bash
    cd docker
    docker-compose up --build
    ```

    The Go webserver will:

    -   Serve the **compiled frontend bundle** as static assets.
    -   Handle API requests and database access.

This makes the entire application self-contained, requiring only Docker to run.

---

## Tech Stack Overview

-   **Backend**: Go (vanilla) + KuzuDB (embedded graph) + SQLite
-   **Frontend**: TypeScript + React + Vite + D3.js
-   **Deployment**: Docker & Docker Compose

---

## TODOs

### General Features

- [ ] **User Authentication**
    - [ ] Required for real data
    - [ ] Anonymous users default to dummy data

- [ ] **RBAC**
  - [ ] Add various permissions
    - [ ] User -- can view and change data for himself, pending review
    - [ ] Admin -- can manage feedback and review/accept data changes
  - [ ] First iteration with read-only users and writing admins

- [x] **Database Migration Support**
    - [x] Add schema migration tooling for SQLite + KuzuDB
    - [x] Versioned upgrade scripts

- [ ] **Internationalization (i18n)**
    - [ ] Externalize frontend strings
    - [ ] Support multiple languages

### UI Controls & Tools

- [ ] **Graph Navigation Controls**
    - [ ] Center view on selected node (i.e. the root)
    - [ ] Zoom in/out buttons
    - [ ] Zoom reset button
    - [ ] Export view as PNG/SVG
    - [ ] Quick navigation to parents (for large graphs)
    - [ ] Limit visualization by distance or generation levels
    - [ ] Search to locate and focus a node directly in the main graph

### Node Details & Editing

- [ ] **Detail View of Nodes**
    - [ ] Edit existing node fields
    - [ ] Insert new nodes with relationships
    - [ ] Delete nodes (with confirmation)
    - [ ] Attach photos to nodes
    - [ ] Add extra fields:
        - [ ] Job / occupation
        - [ ] Location / city
        - [ ] Notes or stories
        - [ ] Multiple photos

### Views

- [ ] **Search View**
    - Show all nodes in a force-directed overview
    - Search by multiple fields (name, date, job, etc.)

- [ ] **Geographic Map View**
    - Overlay family members on a world map (Leaflet/Mapbox)
    - Cluster relatives by city or region

### Miscellaneous

- [ ] **Export Data as CSV**
  - Allow for exporting all the data in the graph database as CSVs