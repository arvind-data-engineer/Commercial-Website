# Backend API Setup Guide

## Quick Start

Your project now has a Python/FastAPI backend to store visitor project requests in PostgreSQL.

### Step 1: Install PostgreSQL
Download from https://www.postgresql.org/download/windows/ (Windows)

### Step 2: Create Database
Open PostgreSQL shell:
```sql
CREATE DATABASE commercial_website;
```

### Step 3: Setup Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### Step 4: Configure .env
Copy `.env.example` to `.env` and add your PostgreSQL password:
```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/commercial_website
```

### Step 5: Run API
```bash
uvicorn main:app --reload --port 8000
```

Visit http://localhost:8000/docs for interactive API documentation.

### Step 6: Enable API in Frontend
Edit `js/script.js` line 7:
```javascript
const USE_API = true;  // Change from false to true
```

## API Endpoints

- **POST** `/api/project-requests` - Save a project request
- **GET** `/api/project-requests` - Get all requests
- **GET** `/api/health` - Check if API is running

## Database Schema

The `project_requests` table stores:
- `id` - Primary key
- `name` - Visitor name
- `email` - Visitor email
- `project_type` - Type of project
- `message` - Project description
- `timeline` - Project timeline
- `budget` - Budget estimate
- `submitted_at` - Submission timestamp

## Troubleshooting

**PostgreSQL Connection Error?**
- Check PostgreSQL is running
- Verify DATABASE_URL in .env matches your setup

**Port 8000 in use?**
```bash
uvicorn main:app --reload --port 8001
```

**ModuleNotFoundError?**
- Ensure virtual environment is activated
- Run `pip install -r requirements.txt` again

## Next Steps

After testing locally:
1. Add JWT authentication
2. Create admin dashboard
3. Deploy to Heroku/Railway/AWS
4. Setup email notifications
