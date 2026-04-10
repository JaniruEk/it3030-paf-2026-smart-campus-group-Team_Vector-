# Member 4 Contribution Report: Security, Notifications & Role Management

## 1. Role Overview
As Member 4, my responsibility was to build the foundational infrastructure of the **Smart Campus Operations Hub**, specifically focusing on strict security protocols, role-based access control (RBAC), and a real-time notification engine. This involved integrating Firebase with Spring Security and ensuring the system is reactive and secure at every layer.

---

## 2. Authentication & Security Engine
I implemented a stateless authentication system using **Firebase OAuth 2.0** and **Spring Security**.

### Key Implementation: `FirebaseAuthenticationFilter.java`
*   **Location**: `backend/smart-campus-backend/src/main/java/lk/sliit/it3030/smartcampus/security/`
*   **How it works**:
    - This is a custom filter that extends `OncePerRequestFilter`. 
    - It intercepts every incoming HTTP request to the API.
    - It extracts the **Bearer Token** from the `Authorization` header.
    - It uses the **Firebase Admin SDK** to verify the token: `FirebaseAuth.getInstance().verifyIdToken(token)`.
    - Once verified, it extracts **Custom Claims** (like `role`) and converts them into Spring Security `GrantedAuthority` objects (e.g., `ROLE_ADMIN`).
    - Finally, it populates the `SecurityContextHolder`, which allows the rest of the application to know "who" is logged in and "what" they can do.

### Key Implementation: `SecurityConfig.java`
*   **Location**: `backend/smart-campus-backend/src/main/java/lk/sliit/it3030/smartcampus/security/`
*   **How it works**:
    - Disables CSRF (it's stateless) and configures **CORS** to allow the React frontend to communicate with the API.
    - Uses `.sessionManagement().sessionCreationPolicy(SessionCreationPolicy.STATELESS)` to ensure the server doesn't store session data, relying entirely on the JWT.
    - Enables **Method-Level Security** using `@EnableMethodSecurity`, allowing developers to use `@PreAuthorize("hasRole('ADMIN')")` on any controller method.

---

## 3. Real-time Notification System (WebSockets)
One of the most innovative parts of the project is the real-time engine, which uses **WebSockets** with the **STOMP protocol**.

### Backend Setup: `WebSocketConfig.java`
*   **Location**: `backend/smart-campus-backend/src/main/java/lk/sliit/it3030/smartcampus/config/`
*   **Technical Details**:
    - **Endpoint Registration**: I registered the `/ws-stomp` endpoint which the React client uses to establish a connection.
    - **Message Broker**: Configured a simple broker where the server can push data to specific prefixes like `/topic` (broadcast) and `/user` (private messages).
    - **Security**: I implemented `JwtChannelInterceptor.java` to ensure that even WebSocket connections are authenticated. Before a user can "Connect," the system verifies their JWT token.

### Logic Layer: `NotificationService.java`
*   **Location**: `backend/smart-campus-backend/src/main/java/lk/sliit/it3030/smartcampus/service/`
*   **Capabilities**:
    - `createNotification(...)`: Saves a notification to Firestore and then immediately "pushes" it to the user's private topic: `/topic/notifications/{userId}`.
    - `broadcastToRole(...)`: Dynamically identifies all users with a specific role (e.g., all Technicians) and sends them a real-time alert about a new task.

---

## 4. Frontend Integration
On the client side, I ensured the user experience remains seamless and reactive.

### Notification Flow: `NotificationContext.tsx`
*   **Location**: `frontend/src/context/`
*   **How it works**:
    - Uses `SockJS` and `@stomp/stompjs` to maintain a persistent connection to the backend.
    - When a user logs in, the context automatically subscribes to two channels:
        1. **Private Channel**: `/topic/notifications/{userUID}` (e.g., "Your booking was approved").
        2. **Public Channel**: `/topic/updates` (e.g., "A new resource was added to the catalogue").
    - When a message arrives, it updates the `notifications` state, which triggers the red "badge" on the notification bell.

### UI Components
*   **`NotificationBell.tsx`**: Displays the unread count and a dropdown for quick actions.
*   **`ProtectedRoute.tsx`**: I implemented a set of route guards that check the `AuthContext` before allowing access to pages. If a non-admin tries to access `/admin`, they are redirected safely.

---

## 5. File-by-File Summary of Work
| Component | Primary File Path | Logic Description |
| :--- | :--- | :--- |
| **Auth Interceptor** | `FirebaseAuthenticationFilter.java` | JWT Extraction and Validation logic. |
| **Security Config** | `SecurityConfig.java` | Endpoint permissions and Filter registration. |
| **WebSocket Core** | `WebSocketConfig.java` | Broker configuration and STOMP endpoints. |
| **Messaging Engine** | `NotificationService.java` | Unicast and Broadcast messaging logic. |
| **Auth State** | `AuthContext.tsx` | Global authentication and role management. |
| **Real-time Context** | `NotificationContext.tsx` | WebSocket subscription and state sync. |
| **Visual Alerts** | `NotificationBell.tsx` | Real-time UI updates for new notifications. |

---

## 6. How to explain this in the Viva
If asked about **WebSockets**, explain the difference between REST (Request-Response) and WebSockets (Full Duplex). Explain that we chose **STOMP (Simple Text Oriented Messaging Protocol)** because it provides a higher-level messaging pattern (Publish-Subscribe) on top of the raw WebSocket connection, which is perfect for features like "Task Assignments" and "Booking Updates" where the server needs to "shout" to the client without being asked.
