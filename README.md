# Smart Campus Operations Hub 🏫

![Smart Campus Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20Spring%20Boot%20%7C%20Firebase-blue)
![Status](https://img.shields.io/badge/Status-Implemented-success)
![Build](https://img.shields.io/badge/Build-Passing-brightgreen)

The **Smart Campus Operations Hub** is a centralized, enterprise-grade facility management platform developed for the **IT3030 Programming Applications and Frameworks (2026)** assignment. It streamlines university operations through resource cataloguing, conflict-free bookings, maintenance ticketing, and real-time alerts.

---

## 🚀 Features & Modules

### Core Modules
*   **Module A: Facilities & Asset Management** (Member 1) - Digital catalogue with capacity-based filtering.
*   **Module B: Booking Engine** (Member 2) - Advanced scheduling with conflict prevention logic.
*   **Module C: Maintenance & Incident Tracking** (Member 3) - Multi-stage ticketing with evidence attachments.
*   **Module D: Real-time Notification Hub** (Member 4) - Role-based STOMP/WebSocket alerts.

## 🛠 Individual Contributions & Reports
Each member has documented their specific technical implementations and architectural decisions:
- [Member 1 Contribution Report](Member1_Contribution_Report.md)
- [Member 2 Contribution Report](Member2_Contribution_Report.md)
- [Member 3 Contribution Report](Member3_Contribution_Report.md)
- [Member 4 Contribution Report](Member4_Contribution_Report.md)

### **Module A: Facilities & Assets Catalogue (Member 1)**
*   **Centralized Asset Registry:** Full CRUD operations for campus resources (Lecture Halls, Labs, Meeting Rooms, Projectors, etc.).
*   **Availability Tracking:** Real-time status management (`ACTIVE`, `OUT_OF_SERVICE`).
*   **Smart Search:** Filterable catalogue by type, capacity, and location to find available resources instantly.

### **Module B: Booking Management (Member 2)**
*   **Workflow Logic:** Complete request lifecycle: `PENDING` → `APPROVED/REJECTED` → `CANCELLED`.
*   **Conflict Prevention:** Intelligent backend validation ensures no two bookings overlap for the same resource.
*   **Personal Ledger:** Users can track their own booking history, while Admins manage the global schedule.

### **Module C: Maintenance & Incident Ticketing (Member 3)**
*   **Fault Reporting:** Users can report incidents (e.g., broken AC, software issues) with priority levels.
*   **Technician Assignment:** Admins assign technicians to specific tickets.
*   **Dynamic Workflow:** Status tracking from `OPEN` to `RESOLVED` with technician resolution notes.
*   **Collaborative Threads:** Real-time comment system for reporters and technicians to communicate.

### **Module D: Unified Notification System (Member 4)**
*   **STOMP/WebSocket Integration:** Real-time "push" alerts for ticket updates, booking approvals, and new comments.
*   **Firestore Persistence:** All notifications are stored in a distributed ledger, ensuring no message is lost.
*   **Interactive UI:** Desktop-style notification bell with read/delete functionality.

### Innovative Enhancements
*   **Real-time Synchronization (STOMP/SockJS)**: Instant dashboard updates without page refreshes.
*   **Enhanced Security**: Firebase OAuth 2.0 integration with custom role-based claims.
*   **Storage-less Image Handling**: High-resolution evidence processing via optimized Base64 compression.

### **Module E: Authentication & Authorization (Member 4)**
*   **Google SSO Integration:** Secure single sign-on via Firebase Authentication.
*   **RBAC Architecture:** Granular access control using Spring Security and Firebase Custom Claims.
*   **Roles:** `ADMIN` (System Management), `TECHNICIAN` (Maintenance), and `USER` (General Access).

---

## 🛠️ Technical Specifications

### **Frontend**
*   **Framework:** React 19 (compiled with Vite)
*   **State Management:** Context API (Auth, Notifications)
*   **Communication:** Axios (Secure JWT interceptors) & SockJS/STOMP (WebSockets)
*   **UI/UX:** Custom CSS3 with **Glassmorphic** aesthetics and full mobile responsiveness.

### **Backend**
*   **Core:** Java 21 & Spring Boot 3.4
*   **Security:** Spring Security 6 & Firebase Admin SDK
*   **Database:** Google Cloud Firestore (NoSQL)
*   **Real-time:** Spring WebSocket Messaging Broker

---

## ⚙️ How to Run Locally

### 1. Prerequisites
*   **Node.js** (v18+)
*   **Java JDK 21**
*   **Firebase Project** (Auth & Firestore enabled)

### 2. Backend Setup
1.  Navigate to root: `cd backend/smart-campus-backend`
2.  Add your service account: Place `firebase-service-account.json` in `src/main/resources/`.
3.  Run the server: 
    ```bash
    ./mvnw spring-boot:run
    ```
    *Server initiates on port `8080`.*

### 3. Frontend Setup
1.  Navigate to root: `cd frontend`
2.  Install dependencies: `npm install`
3.  Launch Dev Server:
    ```bash
    npm run dev
    ```
    *Application is accessible at `http://localhost:5173`.*

---

## 🛡️ Administrative Intelligence
The system includes a hidden **Audit Engine** that automatically logs all critical administrative actions (role changes, resource deletions, status overrides) to a secure audit ledger, providing end-to-end transparency for campus operations.

---

## 👥 The Team
| Name | Contribution |
| :--- | :--- |
| **Member 1** | Facilities Catalogue & Asset Management (Module A) |
| **Member 2** | Booking Workflow & Conflict Validation (Module B) |
| **Member 3** | Incident Ticketing & Technician Operations (Module C) |
| **Member 4** | Real-time Notifications, Security & Auth (Module D & E) |

---

> [!NOTE]
> This project satisfies all requirements for the IT3030 PAF Assignment 2026.
