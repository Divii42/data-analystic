/* SalesPulse – Sales Data Analysis Dashboard */
'use strict';

const $ = (id) => document.getElementById(id);
const money = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0);
const number = (n) => new Intl.NumberFormat('en-US').format(n || 0);
const palette = ['#8068e8', '#55a3e8', '#f0a45e', '#44bd91', '#e879a8', '#8b9bad'];
const DAY = 86400000;

/* ---------- Dates (all handled in local time, stored as YYYY-MM-DD) ---------- */
const pad = (n) => String(n).padStart(2, '0');
const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function parseDate(value) {
  if (value instanceof Date) return isNaN(value) ? null : new Date(value.getFullYear(), value.getMonth(), value.getDate());
  const s = String(value ?? '').trim();
  if (!s) return null;
  let m = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);            // 2026-10-31 or 2026/10/31
  if (m) return validDate(+m[1], +m[2], +m[3]);
  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);              // 31/10/2026 (day first unless clearly month first)
  if (m) {
    let a = +m[1], b = +m[2];
    const day = b > 12 ? b : a, month = b > 12 ? a : b;
    return validDate(+m[3], month, day);
  }
  const d = new Date(s);                                           // "Oct 31, 2026" etc.
  return isNaN(d) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function validDate(y, mo, d) {
  const dt = new Date(y, mo - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d ? dt : null;
}
function fmtDate(s) {
  const d = parseDate(s);
  return d ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : s;
}
function dateOffset(days) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return toISO(d);
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* ---------- Sample data (dates are relative to today so the demo always looks fresh) ---------- */
const seed = [
  ['ORD-1048', -2, 'Wireless Headphones', 'Electronics', 'North', 3, 897],
  ['ORD-1047', -3, 'Running Shoes', 'Fashion', 'West', 2, 240],
  ['ORD-1046', -4, 'Coffee Maker', 'Home & Living', 'East', 1, 129],
  ['ORD-1045', -5, 'Smart Watch', 'Electronics', 'South', 2, 598],
  ['ORD-1044', -7, 'Cotton T-Shirt', 'Fashion', 'North', 5, 125],
  ['ORD-1043', -9, 'Desk Lamp', 'Home & Living', 'West', 3, 147],
  ['ORD-1042', -11, 'Bluetooth Speaker', 'Electronics', 'East', 4, 360],
  ['ORD-1041', -13, 'Backpack', 'Accessories', 'South', 2, 110],
  ['ORD-1040', -15, 'Yoga Mat', 'Sports', 'North', 6, 180],
  ['ORD-1039', -18, 'Leather Wallet', 'Accessories', 'West', 3, 135],
  ['ORD-1038', -21, 'Smart Watch', 'Electronics', 'East', 1, 299],
  ['ORD-1037', -24, 'Running Shoes', 'Fashion', 'South', 4, 480],
  ['ORD-1036', -28, 'Coffee Maker', 'Home & Living', 'North', 2, 258],
  ['ORD-1035', -32, 'Wireless Headphones', 'Electronics', 'West', 2, 598],
  ['ORD-1034', -37, 'Yoga Mat', 'Sports', 'East', 5, 150],
  ['ORD-1033', -43, 'Backpack', 'Accessories', 'South', 4, 220],
  ['ORD-1032', -49, 'Desk Lamp', 'Home & Living', 'North', 2, 98],
  ['ORD-1031', -56, 'Bluetooth Speaker', 'Electronics', 'East', 3, 270],
  ['ORD-1030', -64, 'Cotton T-Shirt', 'Fashion', 'West', 8, 200],
  ['ORD-1029', -72, 'Leather Wallet', 'Accessories', 'South', 5, 225],
  ['ORD-1028', -83, 'Smart Watch', 'Electronics', 'North', 2, 598],
  ['ORD-1027', -95, 'Running Shoes', 'Fashion', 'East', 3, 360],
  ['ORD-1026', -108, 'Coffee Maker', 'Home & Living', 'West', 2, 258],
  ['ORD-1025', -122, 'Wireless Headphones', 'Electronics', 'South', 1, 299],
  ['ORD-1024', -139, 'Yoga Mat', 'Sports', 'North', 4, 120],
  ['ORD-1023', -155, 'Backpack', 'Accessories', 'East', 2, 110],
  ['ORD-1022', -174, 'Desk Lamp', 'Home & Living', 'South', 4, 196],
  ['ORD-1021', -195, 'Bluetooth Speaker', 'Electronics', 'West', 2, 180],
  ['ORD-1020', -218, 'Cotton T-Shirt', 'Fashion', 'North', 6, 150],
  ['ORD-1019', -245, 'Leather Wallet', 'Accessories', 'East', 3, 135]
];
const sampleData = () => seed.map((r) => ({
  orderId: r[0], date: dateOffset(r[1]), product: r[2], category: r[3], region: r[4], units: r[5], revenue: r[6]
}));

/* ---------- State ---------- */
let allData = sampleData();
let filtered = [];
let page = 1;
let revenueChart, categoryChart, regionChart;
const pageSize = 7;
const hasCharts = typeof Chart !== 'undefined';

/* ---------- Filters ---------- */
function unique(key) {
  return [...new Set(allData.map((x) => x[key]).filter(Boolean))].sort();
}
function fillFilters() {
  ['region', 'category'].forEach((k) => {
    const el = $(k + '-filter');
    const old = el.value;
    const values = unique(k);
    el.innerHTML = `<option value="all">All ${k === 'region' ? 'regions' : 'categories'}</option>` +
      values.map((v) => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join('');
    el.value = values.includes(old) ? old : 'all';
  });
}
function latestDate() {
  const times = allData.map((x) => parseDate(x.date)).filter(Boolean).map((d) => d.getTime());
  return times.length ? new Date(Math.max(...times)) : new Date();
}
function applyFilters() {
  const period = $('period-filter').value;
  const region = $('region-filter').value;
  const category = $('category-filter').value;
  let cutoff = null;
  if (period !== 'all') {
    // "Last N days" is measured back from the newest record, so imported older data still works.
    cutoff = new Date(latestDate().getTime() - (Number(period) - 1) * DAY);
  }
  filtered = allData.filter((x) => {
    const d = parseDate(x.date);
    return (!cutoff || (d && d >= cutoff)) &&
      (region === 'all' || x.region === region) &&
      (category === 'all' || x.category === category);
  });
  page = 1;
  render();
}

/* ---------- Calculations ---------- */
const sum = (arr, key) => arr.reduce((a, x) => a + (Number(x[key]) || 0), 0);
function groupBy(key) {
  return filtered.reduce((o, x) => { o[x[key]] = (o[x[key]] || 0) + x.revenue; return o; }, {});
}
// Picks day / week / month buckets depending on how much time the data covers, then sorts oldest → newest.
function trendSeries() {
  const dates = filtered.map((x) => parseDate(x.date)).filter(Boolean);
  if (!dates.length) return { labels: [], values: [] };
  const span = (Math.max(...dates) - Math.min(...dates)) / DAY;
  const mode = span <= 45 ? 'day' : span <= 180 ? 'week' : 'month';
  const buckets = new Map();
  filtered.forEach((x) => {
    const d = parseDate(x.date);
    if (!d) return;
    let start;
    if (mode === 'day') start = d;
    else if (mode === 'week') { start = new Date(d); start.setDate(d.getDate() - ((d.getDay() + 6) % 7)); } // Monday
    else start = new Date(d.getFullYear(), d.getMonth(), 1);
    const key = toISO(start);
    buckets.set(key, (buckets.get(key) || 0) + x.revenue);
  });
  const keys = [...buckets.keys()].sort();
  const label = (k) => {
    const d = parseDate(k);
    if (mode === 'month') return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + (mode === 'week' ? ' (wk)' : '');
  };
  return { labels: keys.map(label), values: keys.map((k) => buckets.get(k)) };
}

/* ---------- Rendering ---------- */
function render() {
  const revenue = sum(filtered, 'revenue');
  const orders = filtered.length;
  $('total-revenue').textContent = money(revenue);
  $('total-orders').textContent = number(orders);
  $('avg-order').textContent = money(orders ? revenue / orders : 0);
  $('units-sold').textContent = number(sum(filtered, 'units'));
  $('record-count').textContent = number(orders);
  renderProducts();
  renderTable();
  renderCharts();
}

function chartBase() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#24243a', padding: 10, cornerRadius: 8,
        titleFont: { family: 'DM Sans' }, bodyFont: { family: 'DM Sans' },
        callbacks: { label: (ctx) => ' ' + money(ctx.parsed.y ?? ctx.parsed) }
      }
    }
  };
}
const axisMoney = (v) => '$' + (v >= 1000 ? (v / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : v);

function renderCharts() {
  const legendEl = $('category-legend');
  const cats = groupBy('category'), catLabels = Object.keys(cats);
  legendEl.innerHTML = catLabels.map((k, i) =>
    `<div class="legend-item"><span class="legend-dot" style="background:${palette[i % palette.length]}"></span><span>${escapeHtml(k)}</span><b class="legend-value">${money(cats[k])}</b></div>`
  ).join('') || '<div class="empty">No category data</div>';

  if (!hasCharts) return; // CDN unavailable – KPIs, table and legend still work

  const trend = trendSeries();
  if (revenueChart) revenueChart.destroy();
  revenueChart = new Chart($('revenue-chart'), {
    type: 'line',
    data: { labels: trend.labels, datasets: [{
      data: trend.values, borderColor: '#8068e8', backgroundColor: 'rgba(128,104,232,.12)', fill: true,
      tension: .38, borderWidth: 2.5, pointRadius: 3, pointBackgroundColor: '#fff', pointBorderWidth: 2, pointBorderColor: '#8068e8'
    }] },
    options: { ...chartBase(), scales: {
      x: { grid: { display: false }, ticks: { color: '#8f95a6', font: { size: 10 }, maxRotation: 0, autoSkipPadding: 12 } },
      y: { beginAtZero: true, grid: { color: '#f0f1f6' }, ticks: { color: '#8f95a6', font: { size: 10 }, callback: axisMoney } }
    } }
  });

  if (categoryChart) categoryChart.destroy();
  categoryChart = new Chart($('category-chart'), {
    type: 'doughnut',
    data: { labels: catLabels, datasets: [{ data: Object.values(cats), backgroundColor: palette, borderWidth: 0, hoverOffset: 4 }] },
    options: { ...chartBase(), cutout: '72%' }
  });

  const regs = groupBy('region'), regLabels = Object.keys(regs);
  if (regionChart) regionChart.destroy();
  regionChart = new Chart($('region-chart'), {
    type: 'bar',
    data: { labels: regLabels, datasets: [{ data: Object.values(regs), backgroundColor: palette, borderRadius: 5, maxBarThickness: 34 }] },
    options: { ...chartBase(), scales: {
      x: { grid: { display: false }, ticks: { color: '#8f95a6', font: { size: 10 } } },
      y: { beginAtZero: true, grid: { color: '#f0f1f6' }, ticks: { color: '#8f95a6', font: { size: 10 }, callback: axisMoney } }
    } }
  });
}

function renderProducts() {
  const products = {};
  filtered.forEach((x) => {
    if (!products[x.product]) products[x.product] = { revenue: 0, category: x.category };
    products[x.product].revenue += x.revenue;
  });
  const top = Object.entries(products).sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 5);
  const max = top[0]?.[1].revenue || 1;
  $('top-products').innerHTML = top.map(([name, v], i) =>
    `<div class="product-row"><div class="product-rank">${i + 1}</div><div><div class="product-name">${escapeHtml(name)}</div><div class="product-category">${escapeHtml(v.category)}<div class="product-track"><div class="product-fill" style="width:${Math.max(0, v.revenue / max * 100)}%"></div></div></div></div><div class="product-revenue">${money(v.revenue)}</div></div>`
  ).join('') || '<div class="empty">No product data</div>';
}

function searchedRows() {
  const q = $('search-input').value.trim().toLowerCase();
  if (!q) return filtered;
  return filtered.filter((x) => [x.orderId, x.product, x.category, x.region, x.date, fmtDate(x.date)].join(' ').toLowerCase().includes(q));
}
function renderTable() {
  const rows = searchedRows();
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  page = Math.min(Math.max(1, page), pages);
  const slice = rows.slice((page - 1) * pageSize, page * pageSize);
  $('sales-tbody').innerHTML = slice.map((x) =>
    `<tr><td>${escapeHtml(x.orderId)}</td><td>${escapeHtml(fmtDate(x.date))}</td><td>${escapeHtml(x.product)}</td><td>${escapeHtml(x.category)}</td><td>${escapeHtml(x.region)}</td><td>${number(x.units)}</td><td>${money(x.revenue)}</td></tr>`
  ).join('') || '<tr><td colspan="7" class="empty">No transactions match your filters.</td></tr>';
  $('table-summary').textContent = `Showing ${slice.length} of ${rows.length} transactions`;
  $('page-label').textContent = `${page} / ${pages}`;
  $('prev-page').disabled = page <= 1;
  $('next-page').disabled = page >= pages;
}

/* ---------- CSV import ---------- */
const FIELD_ALIASES = {
  orderId: ['orderid', 'order', 'id', 'invoice', 'invoiceno', 'ordernumber'],
  date: ['date', 'orderdate', 'saledate', 'invoicedate', 'transactiondate'],
  product: ['product', 'productname', 'item', 'itemname'],
  category: ['category', 'productcategory', 'type'],
  region: ['region', 'country', 'state', 'city', 'area'],
  units: ['units', 'unitssold', 'quantity', 'qty'],
  revenue: ['revenue', 'sales', 'amount', 'total', 'totalsales', 'totalamount', 'price']
};
const normKey = (k) => String(k).toLowerCase().replace(/[^a-z0-9]/g, '');
function toNumber(v) {
  if (typeof v === 'number') return v;
  const n = parseFloat(String(v ?? '').replace(/[^0-9.\-]/g, ''));
  return Number.isFinite(n) ? n : NaN;
}
function mapRow(raw, i) {
  const row = {};
  Object.keys(raw).forEach((k) => { row[normKey(k)] = raw[k]; });
  const pick = (field) => {
    for (const alias of FIELD_ALIASES[field]) {
      if (row[alias] !== undefined && row[alias] !== null && String(row[alias]).trim() !== '') return row[alias];
    }
    return '';
  };
  const date = parseDate(pick('date'));
  const revenue = toNumber(pick('revenue'));
  if (!date || !Number.isFinite(revenue)) return null;
  const units = toNumber(pick('units'));
  return {
    orderId: String(pick('orderId') || `CSV-${i + 1}`),
    date: toISO(date),
    product: String(pick('product') || 'Unspecified'),
    category: String(pick('category') || 'Other'),
    region: String(pick('region') || 'Unspecified'),
    units: Number.isFinite(units) && units > 0 ? units : 1,
    revenue
  };
}
function resetControls() {
  $('period-filter').value = 'all';
  $('region-filter').value = 'all';
  $('category-filter').value = 'all';
  $('search-input').value = '';
}
function loadData(rows) {
  allData = rows;
  fillFilters();
  resetControls();
  applyFilters();
}

$('csv-upload').addEventListener('change', (e) => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  if (typeof Papa === 'undefined') { alert('CSV parser failed to load. Check your internet connection and reload the page.'); return; }
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: (r) => {
      const rows = r.data.map(mapRow).filter(Boolean);
      if (!rows.length) {
        alert('No valid rows found. Your CSV needs a header row with a date column and a revenue / sales / amount column.');
        return;
      }
      loadData(rows);
      const skipped = r.data.length - rows.length;
      alert(`Imported ${rows.length} sales records.` + (skipped ? ` ${skipped} row(s) were skipped (missing date or revenue).` : ''));
    },
    error: (err) => alert('Could not read that file: ' + err.message)
  });
});

/* ---------- CSV export ---------- */
function csvCell(v) {
  let s = String(v ?? '');
  if (/^[=+\-@]/.test(s) && isNaN(Number(s))) s = "'" + s; // stop spreadsheet formula injection
  return `"${s.replace(/"/g, '""')}"`;
}
$('export-btn').addEventListener('click', () => {
  const cols = ['orderId', 'date', 'product', 'category', 'region', 'units', 'revenue'];
  const rows = searchedRows();
  const csv = [cols.join(','), ...rows.map((x) => cols.map((k) => csvCell(x[k])).join(','))].join('\r\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sales-report.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

/* ---------- Events ---------- */
['period-filter', 'region-filter', 'category-filter'].forEach((id) => $(id).addEventListener('change', applyFilters));
$('reset-btn').addEventListener('click', () => { resetControls(); applyFilters(); });
$('sample-btn').addEventListener('click', () => loadData(sampleData()));
$('search-input').addEventListener('input', () => { page = 1; renderTable(); });
$('prev-page').addEventListener('click', () => { page--; renderTable(); });
$('next-page').addEventListener('click', () => { page++; renderTable(); });

/* ---------- Start ---------- */
fillFilters();
applyFilters();
