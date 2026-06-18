"""Generate a practical EDA report for CSV, TSV, JSON, XLS, and XLSX files."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns


MISSING_TOKENS = {"", "na", "n/a", "none", "null", "nan", "-", "--"}
SUPPORTED_EXTENSIONS = {".csv", ".tsv", ".json", ".xls", ".xlsx"}


def normalize_cell(value: Any) -> str:
    if value is None or pd.isna(value):
        return ""
    return str(value).strip()


def slugify_column(value: Any, index: int) -> str:
    text = normalize_cell(value)
    text = re.sub(r"^unnamed:\s*\d+$", "", text, flags=re.I)
    text = re.sub(r"^__empty(?:_\d+)?$", "", text, flags=re.I)
    text = re.sub(r"^empty(?:_\d+)?$", "", text, flags=re.I)
    text = re.sub(r"[^0-9a-zA-Z]+", "_", text).strip("_").lower()
    return text or f"column_{index + 1}"


def clean_columns(columns: list[Any]) -> list[str]:
    seen: dict[str, int] = {}
    cleaned = []
    for index, column in enumerate(columns):
        base = slugify_column(column, index)
        seen[base] = seen.get(base, 0) + 1
        cleaned.append(base if seen[base] == 1 else f"{base}_{seen[base]}")
    return cleaned


def is_generated_header(value: Any) -> bool:
    text = normalize_cell(value)
    return not text or bool(re.match(r"^(unnamed:\s*\d+|__empty(?:_\d+)?|empty(?:_\d+)?)$", text, re.I))


def mostly_numeric(values: list[str]) -> bool:
    useful = [value for value in values if value]
    if not useful:
        return False

    numeric_count = 0
    for value in useful:
        parsed_value = pd.to_numeric(value.replace(",", ""), errors="coerce")
        if pd.notna(parsed_value):
            numeric_count += 1
    return numeric_count / len(useful) >= 0.7


def header_row_score(row: list[Any], next_rows: list[list[Any]]) -> float:
    values = [normalize_cell(value) for value in row]
    useful = [value for value in values if value and not is_generated_header(value)]
    if not useful:
        return 0

    unique_ratio = len(set(value.lower() for value in useful)) / len(useful)
    text_ratio = sum(bool(re.search(r"[A-Za-z]", value)) for value in useful) / len(useful)
    generated_penalty = sum(is_generated_header(value) for value in values) * 0.35
    numeric_penalty = 1.5 if mostly_numeric(useful) else 0
    data_support = 0

    if next_rows:
        width = max(len(values), 1)
        following_values = [
            normalize_cell(next_row[index]) if index < len(next_row) else ""
            for next_row in next_rows[:3]
            for index in range(width)
        ]
        data_support = min(2, sum(bool(value) for value in following_values) / width)

    return (len(useful) * 1.2) + (unique_ratio * 2) + (text_ratio * 2) + data_support - generated_penalty - numeric_penalty


def promote_detected_header(raw_df: pd.DataFrame) -> pd.DataFrame:
    table = raw_df.dropna(axis=0, how="all").dropna(axis=1, how="all")
    if table.empty:
        return table

    rows = table.head(12).values.tolist()
    scored_rows = [
        (index, header_row_score(row, rows[index + 1:]))
        for index, row in enumerate(rows)
    ]
    best_index, best_score = max(scored_rows, key=lambda item: item[1])
    first_score = scored_rows[0][1]
    first_has_generated_headers = any(is_generated_header(value) for value in rows[0])

    header_index = best_index if best_index > 0 and (best_score >= first_score + 1 or first_has_generated_headers) else 0
    headers = clean_columns(list(table.iloc[header_index]))
    data = table.iloc[header_index + 1:].copy()
    data.columns = headers
    return data.reset_index(drop=True)


def load_dataset(path: Path, sheet: str | int | None) -> pd.DataFrame:
    suffix = path.suffix.lower()
    if suffix == ".csv":
        return promote_detected_header(pd.read_csv(path, header=None))
    if suffix == ".tsv":
        return promote_detected_header(pd.read_csv(path, sep="\t", header=None))
    if suffix == ".json":
        df = pd.read_json(path)
        df.columns = clean_columns(list(df.columns))
        return df
    if suffix in {".xls", ".xlsx"}:
        return promote_detected_header(pd.read_excel(path, sheet_name=sheet if sheet is not None else 0, header=None))
    raise ValueError(f"Unsupported file type: {suffix}")


def find_local_dataset(input_dir: Path) -> Path:
    input_dir.mkdir(parents=True, exist_ok=True)
    files = [
        path for path in input_dir.iterdir()
        if path.is_file() and path.suffix.lower() in SUPPORTED_EXTENSIONS
    ]

    if not files:
        supported = ", ".join(sorted(SUPPORTED_EXTENSIONS))
        raise FileNotFoundError(
            f"No dataset found in {input_dir.resolve()}. "
            f"Add a local file with one of these formats: {supported}."
        )

    return max(files, key=lambda path: path.stat().st_mtime)


def clean_dataset(df: pd.DataFrame) -> pd.DataFrame:
    cleaned = df.copy()
    cleaned.columns = clean_columns(list(cleaned.columns))
    cleaned = cleaned.dropna(axis=0, how="all").dropna(axis=1, how="all")

    for column in cleaned.columns:
        if cleaned[column].dtype == "object":
            cleaned[column] = cleaned[column].map(
                lambda value: value.strip() if isinstance(value, str) else value
            )
            cleaned[column] = cleaned[column].replace(list(MISSING_TOKENS), np.nan)

            numeric_candidate = pd.to_numeric(
                cleaned[column].astype(str).str.replace(",", "", regex=False),
                errors="coerce",
            )
            if numeric_candidate.notna().mean() >= 0.75:
                cleaned[column] = numeric_candidate
                continue

            date_candidate = pd.to_datetime(cleaned[column], errors="coerce")
            if date_candidate.notna().mean() >= 0.75:
                cleaned[column] = date_candidate

    return cleaned


def classify_columns(df: pd.DataFrame) -> dict[str, str]:
    roles = {}
    for column in df.columns:
        name = column.lower()
        unique_ratio = df[column].nunique(dropna=True) / max(len(df), 1)
        if any(token in name for token in ["id", "code", "key"]) and unique_ratio > 0.75:
            roles[column] = "identifier"
        elif pd.api.types.is_datetime64_any_dtype(df[column]):
            roles[column] = "date"
        elif pd.api.types.is_numeric_dtype(df[column]):
            if any(token in name for token in ["price", "cost", "sales", "revenue", "amount", "profit"]):
                roles[column] = "measure"
            elif any(token in name for token in ["qty", "quantity", "units"]):
                roles[column] = "quantity"
            else:
                roles[column] = "numeric"
        elif any(token in name for token in ["city", "state", "country", "region", "location"]):
            roles[column] = "location"
        elif df[column].nunique(dropna=True) <= min(30, max(2, len(df) // 2)):
            roles[column] = "category"
        else:
            roles[column] = "text"
    return roles


def safe_json(value: Any) -> Any:
    if isinstance(value, (np.integer, np.floating)):
        return value.item()
    if isinstance(value, pd.Timestamp):
        return value.isoformat()
    if pd.isna(value):
        return None
    return value


def create_charts(df: pd.DataFrame, charts_dir: Path) -> list[str]:
    charts_dir.mkdir(parents=True, exist_ok=True)
    sns.set_theme(style="whitegrid")
    chart_paths: list[str] = []

    missing = df.isna().mean().sort_values(ascending=False).head(15)
    if not missing.empty:
        plt.figure(figsize=(10, 5))
        sns.barplot(x=missing.values * 100, y=missing.index, color="#2563eb")
        plt.xlabel("Missing %")
        plt.ylabel("")
        plt.title("Missing Values by Column")
        path = charts_dir / "missing_values.png"
        plt.tight_layout()
        plt.savefig(path, dpi=160)
        plt.close()
        chart_paths.append(str(path))

    numeric_cols = list(df.select_dtypes(include=np.number).columns)
    category_cols = [
        col for col in df.columns
        if not pd.api.types.is_numeric_dtype(df[col]) and not pd.api.types.is_datetime64_any_dtype(df[col])
    ]
    date_cols = list(df.select_dtypes(include=["datetime", "datetimetz"]).columns)

    for column in numeric_cols[:4]:
        series = df[column].dropna()
        if series.empty:
            continue
        plt.figure(figsize=(9, 5))
        sns.histplot(series, kde=True, color="#0f766e")
        plt.title(f"Distribution: {column}")
        path = charts_dir / f"distribution_{column}.png"
        plt.tight_layout()
        plt.savefig(path, dpi=160)
        plt.close()
        chart_paths.append(str(path))

    for column in category_cols[:4]:
        counts = df[column].astype(str).replace("nan", np.nan).dropna().value_counts().head(10)
        if counts.empty:
            continue
        plt.figure(figsize=(10, 5))
        sns.barplot(x=counts.values, y=counts.index, color="#7c3aed")
        plt.xlabel("Rows")
        plt.ylabel("")
        plt.title(f"Top Values: {column}")
        path = charts_dir / f"top_values_{column}.png"
        plt.tight_layout()
        plt.savefig(path, dpi=160)
        plt.close()
        chart_paths.append(str(path))

    if len(numeric_cols) >= 2:
        corr = df[numeric_cols].corr(numeric_only=True)
        plt.figure(figsize=(8, 6))
        sns.heatmap(corr, annot=True, cmap="vlag", center=0, fmt=".2f")
        plt.title("Numeric Correlation")
        path = charts_dir / "correlation_heatmap.png"
        plt.tight_layout()
        plt.savefig(path, dpi=160)
        plt.close()
        chart_paths.append(str(path))

    if date_cols and numeric_cols:
        monthly = (
            df[[date_cols[0], numeric_cols[0]]]
            .dropna()
            .set_index(date_cols[0])
            .resample("ME")[numeric_cols[0]]
            .sum()
        )
        if len(monthly) > 1:
            plt.figure(figsize=(10, 5))
            monthly.plot(color="#dc2626", marker="o")
            plt.title(f"Monthly Trend: {numeric_cols[0]}")
            plt.xlabel("")
            plt.ylabel(numeric_cols[0])
            path = charts_dir / "monthly_trend.png"
            plt.tight_layout()
            plt.savefig(path, dpi=160)
            plt.close()
            chart_paths.append(str(path))

    return chart_paths


def build_summary(df: pd.DataFrame, original_rows: int) -> dict[str, Any]:
    roles = classify_columns(df)
    missing = (df.isna().mean() * 100).round(2).sort_values(ascending=False)
    numeric_cols = list(df.select_dtypes(include=np.number).columns)

    correlations: list[dict[str, Any]] = []
    if len(numeric_cols) >= 2:
        corr = df[numeric_cols].corr(numeric_only=True).abs()
        pairs = []
        for left in corr.columns:
            for right in corr.columns:
                if left < right:
                    pairs.append((left, right, corr.loc[left, right]))
        correlations = [
            {"left": left, "right": right, "correlation": round(float(value), 3)}
            for left, right, value in sorted(pairs, key=lambda item: item[2], reverse=True)[:5]
        ]

    return {
        "rows": int(len(df)),
        "columns": int(len(df.columns)),
        "column_names": list(df.columns),
        "rows_removed": int(original_rows - len(df)),
        "duplicate_rows": int(df.duplicated().sum()),
        "duplicate_rate": round(float(df.duplicated().mean() * 100), 2) if len(df) else 0,
        "column_roles": roles,
        "missing_percent": {key: safe_json(value) for key, value in missing.items()},
        "numeric_summary": json.loads(df[numeric_cols].describe().round(3).to_json()) if numeric_cols else {},
        "top_correlations": correlations,
    }


def write_markdown_report(summary: dict[str, Any], chart_paths: list[str], output_dir: Path) -> None:
    lines = [
        "# EDA Report",
        "",
        "## Dataset Health",
        "",
        f"- Rows: {summary['rows']}",
        f"- Columns: {summary['columns']}",
        f"- Rows removed during cleaning: {summary['rows_removed']}",
        f"- Duplicate rows: {summary['duplicate_rows']} ({summary['duplicate_rate']}%)",
        "",
        "## Detected Column Names",
        "",
    ]
    lines.extend(f"- `{column}`" for column in summary["column_names"])
    lines.extend([
        "",
        "## Column Roles",
        "",
    ])
    lines.extend(f"- `{column}`: {role}" for column, role in summary["column_roles"].items())

    lines.extend(["", "## Highest Missing Values", ""])
    for column, value in list(summary["missing_percent"].items())[:10]:
        lines.append(f"- `{column}`: {value}%")

    lines.extend(["", "## Strongest Numeric Relationships", ""])
    if summary["top_correlations"]:
        for item in summary["top_correlations"]:
            lines.append(f"- `{item['left']}` vs `{item['right']}`: {item['correlation']}")
    else:
        lines.append("- Not enough numeric columns for correlation analysis.")

    lines.extend(["", "## Charts", ""])
    lines.extend(f"- `{Path(path).relative_to(output_dir)}`" for path in chart_paths)
    (output_dir / "eda_report.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Create an EDA report with cleaned data and charts.")
    parser.add_argument("input", nargs="?", help="Optional path to a CSV, TSV, JSON, XLS, or XLSX file.")
    parser.add_argument("--input-dir", default="datasets", help="Local folder used when no input file is provided.")
    parser.add_argument("--output", default=None, help="Output folder for report files.")
    parser.add_argument("--sheet", default=None, help="Excel sheet name or index. Default: first sheet.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    input_path = Path(args.input) if args.input else find_local_dataset(Path(args.input_dir))
    output_dir = Path(args.output) if args.output else Path("reports") / f"{input_path.stem}_eda"
    output_dir.mkdir(parents=True, exist_ok=True)

    sheet: str | int | None = args.sheet
    if isinstance(sheet, str) and sheet.isdigit():
        sheet = int(sheet)

    original = load_dataset(input_path, sheet)
    cleaned = clean_dataset(original)
    cleaned.to_csv(output_dir / "cleaned_data.csv", index=False)

    summary = build_summary(cleaned, len(original))
    charts = create_charts(cleaned, output_dir / "charts")

    (output_dir / "eda_summary.json").write_text(
        json.dumps(summary, indent=2, default=safe_json),
        encoding="utf-8",
    )
    write_markdown_report(summary, charts, output_dir)

    print(f"Dataset used: {input_path.resolve()}")
    print(f"EDA report created: {output_dir.resolve()}")


if __name__ == "__main__":
    main()
