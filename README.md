# Smart Campus Operations Hub 🏫

![Smart Campus Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20Spring%20Boot%20%7C%20Firebase-blue)
![Status](https://img.shields.io/badge/Status-Completed-success)

The **Smart Campus Operations Hub** is a comprehensive, full-stack enterprise web application designed to centralize and manage university facility operations. Developed for the IT3030 PAF Assignment (2026), this project leverages modern architectural patterns, secure cloud integrations, and a beautiful glassmorphic UI.

---

## 🚀 Features Implemented

### **Module E: Authentication & Authorization (Member 4)**
*   **Firebase Authentication Integration:** Native support for both **Google OAuth 2.0 (SSO)** and standard **Email/Password** authentication.
*   **Production-Ready Auth Flows:** Includes Forgot Password / Reset Links, Real-time Email Validations, and Email Verification gates upon sign-up.
*   **Spring Security JWT Interception:** The Spring Boot backend securely decodes and verifies Firebase ID Tokens on every incoming request.
*   **Role-Based Access Control (RBAC):** Backend annotations (`@PreAuthorize`) restrict sensitive endpoints specifically to `ADMIN`, `TECHNICIAN`, or `USER` roles verified via Firestore custom claims.
*   **Dynamic Auth Context:** Global React Context (`AuthContext.tsx`) manages secure routing (`ProtectedRoute.tsx`) and application-wide session persistence.

### **Module D: Unified Notification System (Member 4)**
*   **Real-time Firestore Engine:** Notifications are fundamentally backed by Firebase Cloud Firestore for instant, cross-platform syncing.
*   **Backend Event Triggers:** A robust `NotificationService` layer in Spring Boot that programmatically fires notifications when bookings or tickets are modified.
*   **Frontend Notification Bell:** A modern, interactive dropdown (`NotificationBell.tsx`) allowing users to view, read, and delete alerts dynamically.
*   **RESTful Compliance:** Includes fully compliant CRUD endpoints (`GET/POST/PATCH/DELETE`) to interact with the notification ledger securely.

---

## 🛠️ Technology Stack

**Frontend Framework:**
*   React 19 (Vite 8 compiler environment)
*   TypeScript
*   Firebase Client SDK (v11)
*   React Router DOM
*   Axios (for secure JWT-injected API requests)
*   Lucide-React (vector iconography)
*   *Styling:* Custom CSS3 with dynamic variables and a completely responsive mobile glassmorphic layout.

**Backend Ecosystem:**
*   Java 21
*   Spring Boot 3
*   Spring Security 6
*   Firebase Admin SDK
*   Maven

---

## ⚙️ How to Run Locally

### 1. Prerequisites
*   Node.js (v18+)
*   Java Development Kit (JDK 21)
*   Maven
*   A Firebase Project with Authentication (Google & Email enabled) and Firestore Database enabled.

### 2. Backend Setup
1.  Navigate into the backend directory: `cd backend/smart-campus-backend`
2.  Obtain your **Firebase Admin SDK Service Account JSON** from the Google Cloud Console.
3.  Place the JSON file at `src/main/resources/firebase-service-account.json`.
4.  Launch the Spring Boot server:
    ```bash
    mvn spring-boot:run
    ```
5.  *The backend will boot up on port `8080`.*

### 3. Frontend Setup
1.  Navigate into the frontend directory: `cd frontend`
2.  Install all dependencies: `npm install`
3.  Open `src/config/firebase.ts` and replace the placeholder `firebaseConfig` object with your actual Firebase project settings.
4.  Start the Vite dev server:
    ```bash
    npm run dev
    ```
5.  *The frontend will boot up on `http://localhost:5173`.*

---

## 🛡️ Security & Roles
The primary mechanism for evaluating authorization operates directly through Spring Security Filters. Tokens passed in the `Authorization: Bearer <token>` header are evaluated against Google's public keys. Role evaluation is mapped through Firestore document attributes during connection handshake to verify permissions natively.

*Currently permitted roles: `USER`, `ADMIN`, `TECHNICIAN`.*
