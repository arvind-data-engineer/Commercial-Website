# Python EDA Tool

Use this tool when a dataset needs deeper analysis than the static website preview can provide.

## Setup

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r tools\requirements.txt
```

## Run

Put your local dataset inside the project `datasets/` folder, then run:

```powershell
python tools\eda_report.py
```

The tool automatically picks the newest supported file from `datasets/`.

You can still pass a file manually when needed:

```powershell
python tools\eda_report.py path\to\data.csv --output reports\sales_eda
python tools\eda_report.py path\to\data.xlsx --sheet Sheet1 --output reports\sales_eda
```

The script writes:

- `cleaned_data.csv`
- `eda_summary.json`
- `eda_report.md`
- chart images in `charts/`

It also scans the first rows of CSV, TSV, and Excel files to detect the real header row. This helps when a file starts with blank rows, title text, or Excel-generated columns such as `empty`, `empty_1`, or `Unnamed: 0`.

Supported inputs: CSV, TSV, JSON, XLS, and XLSX.
