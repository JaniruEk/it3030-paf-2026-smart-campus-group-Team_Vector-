# it3030-paf-2026-smart-campus-group-Team_Vector-
Smart Campus Operations Hub - IT3030 PAF Assignment 2026
# 🏫 Smart Campus Operations Hub

IT3030 PAF Assignment 2026 - Semester 1  
**Group**: Team_Vector

This repository contains the source code for both the **Spring Boot REST API** (Backend) and the **React** client web application (Frontend) integrated with Firebase Firestore and Authentication.

---

## 🚀 Getting Started

Follow these steps to set up the project locally on your machine.

### 1. Clone the Repository
Open your terminal and clone the repository:
```bash
git clone <repository_url>
cd it3030-paf-2026-smart-campus-group-Team_Vector-
```

### 2. 🔐 Firebase Credentials Setup (Crucial Step)
For security purposes, the `firebase-service-account.json` file containing our backend database credentials has been **ignored** in Git and will not be downloaded when you clone the project.

**To get the backend working:**
1. Request the `firebase-service-account.json` file directly from the team lead (do not share it over public channels).
2. Create a `resources` folder if one doesn't exist, and place the file inside:
   `backend/smart-campus-backend/src/main/resources/firebase-service-account.json`
3. Ensure the file is named exactly `firebase-service-account.json`.

### 3. Setting up the Backend (Spring Boot)
Our backend runs on Java 21 and Spring Boot 3.4.

1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend/smart-campus-backend
   ```
2. Build the project and download all Maven dependencies:
   ```bash
   # On Windows (PowerShell/CMD)
   .\mvnw.cmd clean compile
   
   # On Mac/Linux
   ./mvnw clean compile
   ```
3. Run the Spring Boot application:
   ```bash
   # On Windows
   .\mvnw.cmd spring-boot:run
   ```
4. The backend API will start on **http://localhost:8080**.

### 4. Setting up the Frontend (React + Vite)
Our frontend uses React with Vite.

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install Node.js dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. The frontend will start on **http://localhost:5173**.

---

## 📂 Project Structure
- `/backend/smart-campus-backend` - The Spring Boot Java API
- `/frontend` - The React Vite client app
- `/.github/workflows/ci.yml` - CI/CD pipeline for GitHub Actions

## 💡 Troubleshooting
- **FirebaseApp [DEFAULT] doesn't exist error**: This means you forgot to place the `firebase-service-account.json` in the `src/main/resources` folder, or the file is corrupted.
- **Port 8080 or 5173 already in use**: Make sure you don't have other instances of the backend or frontend running in the background.
