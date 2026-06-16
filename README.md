# Data With Arvind Portfolio Website

A static portfolio website for data engineering, Power BI dashboards, Python automation, SQL reporting, and Azure pipeline case studies. The repository also includes an optional FastAPI backend for saving contact/project requests.

## Project Structure

```text
.
├── index.html                  # Home page
├── about.html                  # Profile and skills
├── services.html               # Service offerings
├── portfolio.html              # Featured work
├── contact.html                # Contact form and visitor request table
├── blog.html                   # Blog overview
├── azure-etl-pipeline.html     # Legacy redirect page
├── css/
│   └── style.css               # Shared site styles
├── js/
│   └── script.js               # Contact form storage/API logic
├── projects/                   # Detailed project pages and ETL sample
└── backend/                    # Optional FastAPI API
```

## Run The Website

Open `index.html` directly in a browser. The site is static and does not require a build step.

The contact form currently stores requests in browser `localStorage`. To use the FastAPI backend instead, start the backend and set `USE_API` to `true` in `js/script.js`.

## Run The Backend

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Create a `.env` file from `backend/.env.example` and update `DATABASE_URL` before running the API.

## Code Style

- Use 2 spaces for HTML, CSS, JavaScript, and Markdown.
- Use 4 spaces for Python.
- Keep shared styles in `css/style.css`.
- Keep project case studies inside `projects/`.
