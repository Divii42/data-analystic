# SalesPulse — Sales Data Analysis Dashboard

A responsive, front-end sales analytics dashboard built with HTML, CSS and JavaScript. It includes sample data so it works immediately, plus CSV import and report export.

## Run in VS Code

1. Extract `sales-data-dashboard.zip`.
2. Open the extracted `sales-data-dashboard` folder in VS Code.
3. Install the **Live Server** extension (Ritwick Dey).
4. Right-click `index.html` → **Open with Live Server**.

You can also open `index.html` directly in a browser. Chart.js and Papa Parse are loaded from public CDNs, so an internet connection is needed for charts and CSV import.

## Features

- KPI cards: revenue, orders, average order value and units sold
- Revenue trend, category doughnut and regional bar charts
- Top five products
- Searchable, paginated transactions table
- Filters by date range, region and category
- Import your own CSV file (a ready-made example is in `data/sample-sales.csv`)
- "Sample data" button to go back to the demo data
- Export the currently filtered and searched records to CSV (opens correctly in Excel)
- Responsive desktop and mobile layout

## CSV format

The importer accepts common header names. Recommended columns:

```csv
order_id,date,product,category,region,units,revenue
ORD-1001,2026-10-01,Wireless Headphones,Electronics,North,2,598
ORD-1002,2026-10-02,Running Shoes,Fashion,West,1,120
```

Recognized alternatives include `Order ID`, `Date`, `Product`, `Category`, `Region`, `Quantity`, `Sales`, and `Amount`. Dates should look like `YYYY-MM-DD` (recommended) or `DD/MM/YYYY`. Currency symbols and commas in revenue are ignored. Rows without a valid date or revenue are skipped.

## Project structure

```text
sales-data-dashboard/
├── index.html
├── styles.css
├── app.js
├── README.md
└── data/
    └── sample-sales.csv
```

## Notes

- This is a client-side demo project; it does not require a database or backend.
- Imported data stays in the current browser session and is not uploaded to a server.
- Currency formatting is set to USD in `app.js`. Change `currency: 'USD'` to your preferred ISO currency code if needed.

## What was fixed

- Revenue trend now sorts oldest to newest and switches between daily, weekly and monthly buckets based on the data range.
- Importing a CSV no longer blanks the Region/Category filters.
- Flexible CSV headers, `DD/MM/YYYY` dates and `$1,200` style amounts are handled.
- "Last N days" is measured from the newest record, so older imported data still shows.
- Dates no longer shift by a day in some time zones.
- Charts are pinned to Chart.js 4.4.1, tooltips show currency, and the page still works if the CDN is blocked.
- Missing `data/sample-sales.csv` added; export is protected against spreadsheet formula injection.
