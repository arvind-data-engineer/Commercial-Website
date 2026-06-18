# Data With Arvind Portfolio Website

A static portfolio website for data engineering, Power BI dashboards, Python automation, SQL reporting, and Azure pipeline case studies. The repository also includes a browser data preview page, a dedicated Python EDA tool, and an optional FastAPI backend for saving contact/project requests.

## Project Structure

```text
.
|-- index.html                  # Home page
|-- about.html                  # Profile and skills
|-- services.html               # Service offerings
|-- portfolio.html              # Featured work
|-- contact.html                # Contact form and visitor request table
|-- blog.html                   # Blog overview
|-- data-analyzer.html          # Browser preview for uploaded datasets
|-- azure-etl-pipeline.html     # Legacy redirect page
|-- css/
|   `-- style.css               # Shared site styles
|-- js/
|   |-- script.js               # Contact form storage/API logic
|   `-- live-analytics.js       # Static browser data preview logic
|-- tools/
|   |-- eda_report.py           # Python EDA report generator
|   |-- requirements.txt        # EDA tool dependencies
|   `-- README.md               # EDA tool usage
|-- projects/                   # Detailed project pages and ETL sample
`-- backend/                    # Optional FastAPI API
```

## Run The Website

Open `index.html` directly in a browser. The site is static and does not require a build step.

The contact form currently stores requests in browser `localStorage`. To use the FastAPI backend instead, start the backend and set `USE_API` to `true` in `js/script.js`.

## Run The Python EDA Tool

Use this when you need proper dataset cleaning, column identity checks, KPI summaries, correlations, and chart files.

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r tools\requirements.txt
python tools\eda_report.py
```

The EDA tool reads the newest local dataset from `datasets/` by default. It supports CSV, TSV, JSON, XLS, and XLSX files. It creates a cleaned CSV, a JSON summary, a Markdown report, and chart images inside the output folder.

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
- Keep browser data preview logic in `js/live-analytics.js`.
- Keep deeper EDA/report generation logic in `tools/`.
- Keep project case studies inside `projects/`.
