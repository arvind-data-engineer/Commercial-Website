# Commercial Website Backend API

A FastAPI backend to store visitor project requests in a PostgreSQL database.

## Setup Instructions

### 1. Install PostgreSQL

**Windows:**
- Download from: https://www.postgresql.org/download/windows/
- During setup, remember the password you set for `postgres` user
- Default port: 5432

**macOS:**
```bash
brew install postgresql
```

**Linux (Ubuntu):**
```bash
sudo apt-get install postgresql postgresql-contrib
```

### 2. Create Database

Open PostgreSQL shell and run:

```sql
CREATE DATABASE commercial_website;
```

### 3. Install Python Dependencies

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
```

### 4. Configure Environment

Copy `.env.example` to `.env` and update with your database credentials:

```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/commercial_website
```

### 5. Run the API

```bash
uvicorn main:app --reload --port 8000
```

API will be available at: `http://localhost:8000`

### 6. View API Documentation

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## API Endpoints

### Save a Project Request
**POST** `/api/project-requests`

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "project_type": "Power BI dashboard",
  "message": "Need a sales dashboard",
  "timeline": "2 weeks",
  "budget": "$5000"
}
```

### Get All Requests
**GET** `/api/project-requests`

### Get Single Request
**GET** `/api/project-requests/{id}`

### Delete Request
**DELETE** `/api/project-requests/{id}`

### Health Check
**GET** `/api/health`

## Frontend Integration

Update `js/script.js` to call your API instead of using localStorage.

Example:
```javascript
const response = await fetch('http://localhost:8000/api/project-requests', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(formData)
});
```

## Troubleshooting

**Connection Error?**
- Ensure PostgreSQL is running
- Check `DATABASE_URL` in `.env`
- Verify database exists

**Port 8000 in use?**
```bash
uvicorn main:app --reload --port 8001
```

## Next Steps

- Add authentication (JWT tokens)
- Add email notifications
- Deploy to Heroku, Railway, or AWS
- Connect a admin dashboard
