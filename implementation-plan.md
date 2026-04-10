# Global Schedule Handler - Implementation Plan

## 1. Overview & Goals
Build a visually appealing web application that allows users to create daily schedules and securely request/share them with others. A core feature is timezone synchronization: when a schedule is shared across timezones (e.g., from IST to CET), the viewer sees both the creator's original time and their own local time for each event. The system will use a robust microservices architecture, automated CI/CD, and modern containerized deployment.

## 2. Architecture & Tech Stack
**Architecture: Microservices with API Gateway**
- **API Gateway:** Spring Cloud Gateway to route requests to backend microservices.
- **Microservices:**
  - **User Service:** Manages user profiles, authentication, and timezone preferences.
  - **Schedule Service:** Manages the creation and retrieval of daily events.
  - **Sharing/Request Service:** Handles the workflow of requesting, accepting, and declining schedule access.
- **Backend Framework:** Spring Boot (Java).
- **Database:** PostgreSQL (Managed instance or containerized per service).
- **Frontend:** React (TypeScript) with Vanilla CSS (Deployed to Vercel).
- **Containerization:** Docker for all microservices.
- **Orchestration:** Kubernetes (K8s) for managing microservice clusters.

## 3. Data Model (High-Level)
**User Service:**
- `User`: `id`, `username`, `defaultTimezone`

**Schedule Service:**
- `Event`: `id`, `userId`, `title`, `description`, `startTime` (UTC), `endTime` (UTC), `originalTimezone`

**Sharing Service:**
- `ScheduleRequest`: `id`, `requesterId`, `targetUserId`, `requestedDate`, `status` (PENDING, ACCEPTED, DECLINED)

## 4. Key Features & Workflows

### A. Schedule & Timezone Sync
- Users create events in their local time; stored in UTC with `originalTimezone` metadata.
- Shared views display both the viewer's local time and the creator's original time.

### B. Request/Acceptance Workflow
1. **Request:** Requester asks for a specific date's schedule.
2. **Inbox:** Target user receives a notification in their 'Requests' section.
3. **Validation:** Target can only "Accept" if they have a schedule for that specific date.
4. **Separation:** Accepted schedules appear in a "Shared Schedules" tab, separate from personal entries.

### C. Timeline Comparison (Merging)
- A "Compare" mode overlays the shared schedule onto the user's own timeline.
- Both are synchronized to the viewer's local timezone for intuitive gap/conflict detection.

## 5. Deployment & CI/CD Strategy

### A. Containerization (Docker)
- Each Spring Boot microservice will have a multi-stage `Dockerfile` to produce slim, production-ready images.
- A `docker-compose.yml` file will be provided for local development and testing of the full stack.

### B. Orchestration (Kubernetes)
- K8s manifests (Deployments, Services, ConfigMaps, Secrets) for each microservice.
- Ingress controller setup to manage external access via the API Gateway.
- **Note on Vercel:** While the React Frontend will be deployed to Vercel (Free Plan), the backend microservices (Spring Boot + K8s) require a separate K8s-compatible provider (e.g., Minikube for local, or a cloud provider like GCP/AWS/DigitalOcean) as Vercel primarily hosts frontend/serverless functions.

### C. CI/CD Pipeline (GitHub Actions)
- **Workflow:** Triggered on every push to the `main` branch.
- **Frontend:** Automatically triggers Vercel's native deployment.
- **Backend:** 
  1. Build and Test Java services using Maven.
  2. Build Docker images for each service.
  3. Push images to a Container Registry (e.g., Docker Hub or GitHub Packages).
  4. (Optional) Automated deployment update to the K8s cluster.

## 6. Development Phases

**Phase 1: Architecture & Scaffolding**
- Setup Spring Boot microservices, Spring Cloud Gateway, and React frontend.
- Create `Dockerfiles` for each component.

**Phase 2: Core Logic & Features**
- Build User/Schedule/Sharing services and the React UI.
- Implement the "Request -> Validate -> Accept" workflow.
- Implement timezone sync and comparison timeline.

**Phase 3: DevOps & CI/CD**
- Configure GitHub Actions workflows for automated builds and Vercel deployments.
- Write Kubernetes manifests for backend orchestration.

**Phase 4: Polish & Refinement**
- Enhance visual aesthetics (Vanilla CSS).
- Final integration testing of the microservices communication and timezone edge cases.