from pathlib import Path

import pandas as pd

BASE_DIR = Path(__file__).resolve().parent
INPUT_DIR = BASE_DIR / "sample_data"
OUTPUT_DIR = BASE_DIR / "output"
OUTPUT_DIR.mkdir(exist_ok=True)

SALES_FILE = INPUT_DIR / "sales.csv"
PRODUCTS_FILE = INPUT_DIR / "products.csv"

REQUIRED_COLUMNS = [
    "order_id",
    "order_date",
    "product_id",
    "customer_id",
    "quantity",
    "unit_price",
]


def load_data():
    sales = pd.read_csv(SALES_FILE)
    products = pd.read_csv(PRODUCTS_FILE)
    return sales, products


def validate_sales(sales: pd.DataFrame) -> pd.DataFrame:
    missing_columns = [c for c in REQUIRED_COLUMNS if c not in sales.columns]
    if missing_columns:
        raise ValueError(f"Missing required sales columns: {missing_columns}")

    if sales[REQUIRED_COLUMNS].isnull().any().any():
        raise ValueError("Sales file contains null values in required columns")

    sales["order_date"] = pd.to_datetime(sales["order_date"], errors="coerce")
    if sales["order_date"].isnull().any():
        raise ValueError("Some order_date values could not be parsed")

    duplicate_orders = sales[sales.duplicated(subset=["order_id"], keep=False)]
    if not duplicate_orders.empty:
        duplicate_ids = duplicate_orders["order_id"].tolist()
        raise ValueError(f"Duplicate order_id values found: {duplicate_ids}")

    return sales


def transform_sales(sales: pd.DataFrame, products: pd.DataFrame) -> pd.DataFrame:
    products = products[["product_id", "product_name", "standard_category"]]
    sales = sales.merge(products, on="product_id", how="left")

    if sales["product_name"].isnull().any():
        missing = sales[sales["product_name"].isnull()]["product_id"].unique().tolist()
        raise ValueError(f"Sales rows reference unknown product_ids: {missing}")

    sales["revenue"] = sales["quantity"] * sales["unit_price"]
    sales["order_month"] = sales["order_date"].dt.to_period("M").astype(str)
    sales["order_day"] = sales["order_date"].dt.date
    sales["product_category"] = sales["standard_category"].fillna("Unknown")

    fact_sales = sales[
        [
            "order_id",
            "order_date",
            "order_month",
            "order_day",
            "customer_id",
            "product_id",
            "product_name",
            "product_category",
            "quantity",
            "unit_price",
            "revenue",
        ]
    ]

    return fact_sales


def build_daily_summary(fact_sales: pd.DataFrame) -> pd.DataFrame:
    daily_summary = (
        fact_sales.groupby(["order_month", "product_category"], as_index=False)
        .agg(
            total_orders=("order_id", "nunique"),
            total_quantity=("quantity", "sum"),
            total_revenue=("revenue", "sum"),
        )
    )
    return daily_summary


def save_outputs(fact_sales: pd.DataFrame, daily_summary: pd.DataFrame) -> None:
    fact_sales.to_csv(OUTPUT_DIR / "fact_sales.csv", index=False)
    daily_summary.to_csv(OUTPUT_DIR / "sales_summary_by_category.csv", index=False)


def main():
    sales, products = load_data()
    sales = validate_sales(sales)
    fact_sales = transform_sales(sales, products)
    daily_summary = build_daily_summary(fact_sales)
    save_outputs(fact_sales, daily_summary)
    print(f"Saved fact_sales.csv and sales_summary_by_category.csv to {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
