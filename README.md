# ReportFlow

Full-stack ReportFlow project:

- `backend`: Spring Boot REST API using PostgreSQL, ready to import into Spring Tool Suite.
- `gateway`: FastAPI gateway that proxies frontend calls to Spring Boot.
- `frontend`: React + Vite dashboard UI.

MongoDB is not used.

## Prerequisites

- Java 17+
- Maven 3.9+
- Python 3.10+
- Node.js 18+
- PostgreSQL 14+

## Start PostgreSQL

Create a local database:

```sql
CREATE DATABASE reportdb;
ALTER USER postgres WITH PASSWORD 'admin123';
```

You only need to create the PostgreSQL database. Spring Boot creates the tables automatically from the JPA entity classes when the app starts.

## Run Spring Boot Backend

Open `backend` in Spring Tool Suite as an existing Maven project, then run `ReportManagementApplication`.

From terminal:

```powershell
cd backend
mvn spring-boot:run
```

Backend runs on `http://localhost:8081`.

On first startup, Spring Boot creates or updates these tables automatically:

- `users`
- `reports`

## Run FastAPI Gateway

```powershell
cd gateway
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Gateway runs on `http://localhost:8000`.

## Run React Frontend

```powershell
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

## Default API Flow

React calls FastAPI at `/api/*`; FastAPI forwards to Spring Boot at `http://localhost:8081/api/*`.

## CSV Report Upload

Create Report supports uploading a `.csv` file instead of typing data manually.

CSV headers must be:

```csv
Item,Value
North Region,48200
South Region,39450
```

Spring Boot stores the uploaded data in PostgreSQL and calculates total value and average value.

## JWT Authentication

Spring Boot now uses JWT authentication:

- `POST /api/auth/login` returns user details and a JWT token.
- `POST /api/auth/register` creates a user and returns a JWT token.
- All other `/api/**` endpoints require `Authorization: Bearer <token>`.
- React stores the token in `localStorage` as `reportSession`.
- FastAPI forwards the `Authorization` header to Spring Boot.

For production, change `JWT_SECRET` to a long private value before starting Spring Boot.
