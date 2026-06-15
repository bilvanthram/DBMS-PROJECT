export function parseCsvText(text) {
  const lines = String(text || '')
    .split(/\r?\n/)
    .filter((line) => line.trim());

  if (lines.length < 2) {
    throw new Error('CSV must include a header and at least one data item');
  }

  const headers = parseCsvLine(lines[0]).map((header) => stripBom(header).trim().toLowerCase());
  const itemIndex = headers.indexOf('item');
  const valueIndex = headers.indexOf('value');

  if (itemIndex < 0 || valueIndex < 0) {
    throw new Error('CSV headers must be: Item, Value');
  }

  return lines.slice(1).map((line) => {
    const columns = parseCsvLine(line);
    return {
      item: (columns[itemIndex] || '').trim(),
      value: (columns[valueIndex] || '').trim(),
    };
  });
}

function stripBom(value) {
  return String(value || '').replace(/^\uFEFF/, '');
}

export function parseCsvLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (character === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += character;
    }
  }

  values.push(current);
  return values;
}

export function parseReportData(reportData) {
  if (!reportData) return [];
  if (Array.isArray(reportData)) return reportData;

  try {
    const items = JSON.parse(reportData);
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

export function parseDepartmentInsights(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;

  try {
    const insights = JSON.parse(value);
    return Array.isArray(insights) ? insights : [];
  } catch {
    return [];
  }
}

export function summarizeItems(items) {
  const filledItems = getFilledItems(items);
  const total = filledItems.reduce((sum, item) => sum + parseNumber(item.value), 0);
  const average = filledItems.length ? total / filledItems.length : 0;
  const highest = filledItems.reduce((best, item) => {
    if (!best) return item;
    return parseNumber(item.value) > parseNumber(best.value) ? item : best;
  }, null);

  return {
    itemCount: filledItems.length,
    total,
    average,
    highestItem: highest?.item || '-',
    highestValue: highest ? parseNumber(highest.value) : 0,
  };
}

export function buildDepartmentInsights(department, items) {
  const filledItems = getFilledItems(items);
  const normalized = normalizeDepartment(department);
  const total = filledItems.reduce((sum, item) => sum + parseNumber(item.value), 0);

  if (normalized === 'Finance') return financeInsights(filledItems);
  if (normalized === 'Sales') return salesInsights(filledItems);
  if (normalized === 'HR') return hrInsights(filledItems);
  if (normalized === 'Operations') return operationsInsights(filledItems);

  const summary = summarizeItems(filledItems);
  return [
    insight('Total Value', formatPlain(total)),
    insight('Average Value', formatPlain(summary.average)),
    insight('Highest Value', formatPlain(summary.highestValue)),
    insight('Highest Value Item', summary.highestItem),
  ];
}

export function downloadReportAsCsv(report) {
  const insights = parseDepartmentInsights(report.departmentInsights);
  const csvItems = [
    ['Report Name', report.name || ''],
    ['Report Type', report.reportType || ''],
    ['Department', report.department || ''],
    ['Date From', report.dateFrom || ''],
    ['Date To', report.dateTo || ''],
    [],
    ['Insight', 'Value'],
    ...insights.map((item) => [item.label || '', item.value || '']),
  ];

  downloadBlob(toCsv(csvItems), `${fileSlug(report.name || 'report')}.csv`, 'text/csv;charset=utf-8');
}

export function downloadReportAsExcel(report) {
  const insights = parseDepartmentInsights(report.departmentInsights);
  const html = `
    <html>
      <head><meta charset="utf-8" /></head>
      <body>
        <table>
          <tr><th>Report Name</th><td>${escapeHtml(report.name)}</td></tr>
          <tr><th>Report Type</th><td>${escapeHtml(report.reportType)}</td></tr>
          <tr><th>Department</th><td>${escapeHtml(report.department)}</td></tr>
          <tr><th>Date From</th><td>${escapeHtml(report.dateFrom)}</td></tr>
          <tr><th>Date To</th><td>${escapeHtml(report.dateTo)}</td></tr>
        </table>
        <br />
        <table>
          <tr><th>Insight</th><th>Value</th></tr>
          ${insights.map((item) => `<tr><td>${escapeHtml(item.label)}</td><td>${escapeHtml(item.value)}</td></tr>`).join('')}
        </table>
      </body>
    </html>
  `;

  downloadBlob(html, `${fileSlug(report.name || 'report')}.xls`, 'application/vnd.ms-excel;charset=utf-8');
}

export function downloadReportAsPrintHtml(report) {
  const items = parseReportData(report.reportData);
  const insights = parseDepartmentInsights(report.departmentInsights);
  const summary = summarizeItems(items);
  const html = `<!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(report.name || 'Report')}</title>
        <style>
          body { color: #101828; font-family: Arial, sans-serif; margin: 32px; }
          h1 { margin: 0 0 8px; }
          .muted { color: #667085; margin-bottom: 24px; }
          .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 18px 0; }
          .box { border: 1px solid #d0d5dd; padding: 10px; }
          .box span { color: #667085; display: block; font-size: 12px; font-weight: 700; }
          .box strong { display: block; margin-top: 5px; }
          table { border-collapse: collapse; margin-top: 14px; width: 100%; }
          th, td { border: 1px solid #d0d5dd; padding: 9px; text-align: left; }
          th { background: #f2f4f7; }
          @media print { button { display: none; } body { margin: 18px; } }
        </style>
      </head>
      <body>
        <button onclick="window.print()">Print or Save as PDF</button>
        <h1>${escapeHtml(report.name || 'Report')}</h1>
        <div class="muted">${escapeHtml(report.reportType)} | ${escapeHtml(report.department)} | ${escapeHtml(report.dateFrom)} to ${escapeHtml(report.dateTo)}</div>
        <p>${escapeHtml(report.description || '')}</p>
        <div class="grid">
          ${metricBox('Total Value', formatNumber(summary.total))}
          ${metricBox('Average Value', formatNumber(summary.average))}
          ${metricBox('Top Item', summary.highestItem)}
        </div>
        <h2>Department Insights</h2>
        <table>
          <tr><th>Insight</th><th>Value</th></tr>
          ${insights.map((item) => `<tr><td>${escapeHtml(item.label)}</td><td>${escapeHtml(item.value)}</td></tr>`).join('')}
        </table>
      </body>
    </html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const printWindow = window.open(url, '_blank');

  if (!printWindow) {
    URL.revokeObjectURL(url);
    downloadBlob(html, `${fileSlug(report.name || 'report')}-print.html`, 'text/html;charset=utf-8');
    return;
  }

  setTimeout(() => {
    printWindow.focus();
    printWindow.print();
    URL.revokeObjectURL(url);
  }, 600);
}

function financeInsights(items) {
  let revenue = 0;
  let expenses = 0;

  items.forEach((item) => {
    const value = parseNumber(item.value);
    const text = itemText(item);
    if (matches(text, 'expense', 'cost', 'loss', 'debit', 'tax', 'salary', 'rent', 'purchase', 'bill') || value < 0) {
      expenses += Math.abs(value);
    } else {
      revenue += value;
    }
  });

  const net = revenue - expenses;
  return [
    insight('Revenue', formatPlain(revenue)),
    insight('Expenses', formatPlain(expenses)),
    insight('Profit', formatPlain(Math.max(net, 0))),
    insight('Loss', formatPlain(Math.max(-net, 0))),
    insight('Net Profit/Loss', formatPlain(net)),
    insight('Average Transaction', formatPlain((revenue + expenses) / (items.length || 1))),
    insight('Profit Margin %', formatPlain(revenue ? (net * 100) / revenue : 0)),
  ];
}

function salesInsights(items) {
  const target = sumMatching(items, 'target', 'goal', 'quota');
  const revenue = items
    .filter((item) => !matches(itemText(item), 'target', 'goal', 'quota'))
    .reduce((sum, item) => sum + parseNumber(item.value), 0);
  const topItem = maxItem(items);

  return [
    insight('Sales Revenue', formatPlain(revenue)),
    insight('Sales Target', formatPlain(target)),
    insight('Target Achievement %', formatPlain(target ? (revenue * 100) / target : 0)),
    insight('Average Sale', formatPlain(revenue / (items.length || 1))),
    insight('Highest Sale', formatPlain(parseNumber(topItem?.value))),
    insight('Top Sales Item', topItem?.item || 'No item'),
  ];
}

function hrInsights(items) {
  const hired = sumMatching(items, 'hired', 'joined', 'recruited', 'onboarded');
  const resigned = sumMatching(items, 'resigned', 'terminated', 'exit', 'left', 'attrition');
  const payroll = sumMatching(items, 'payroll', 'salary', 'wage', 'compensation');
  const attendance = sumMatching(items, 'attendance', 'present', 'working days');

  return [
    insight('Employees Hired', formatPlain(hired)),
    insight('Employees Resigned', formatPlain(resigned)),
    insight('Net Headcount Change', formatPlain(hired - resigned)),
    insight('Attrition Rate %', formatPlain(hired + resigned ? (resigned * 100) / (hired + resigned) : 0)),
    insight('Payroll Total', formatPlain(payroll)),
    insight('Attendance Total', formatPlain(attendance)),
  ];
}

function operationsInsights(items) {
  const completed = sumMatching(items, 'completed', 'produced', 'delivered', 'processed', 'output');
  const pending = sumMatching(items, 'pending', 'delayed', 'backlog', 'failed', 'defect', 'issue');
  const totalWork = completed + pending;

  return [
    insight('Completed Output', formatPlain(completed)),
    insight('Pending/Defect Work', formatPlain(pending)),
    insight('Total Work', formatPlain(totalWork)),
    insight('Efficiency %', formatPlain(totalWork ? (completed * 100) / totalWork : 0)),
    insight('Average Output', formatPlain(completed / (items.length || 1))),
    insight('Completion Gap', formatPlain(pending)),
  ];
}

function getFilledItems(items) {
  return items.filter((item) => item.item || item.value);
}

function sumMatching(items, ...keywords) {
  return items
    .filter((item) => matches(itemText(item), ...keywords))
    .reduce((sum, item) => sum + Math.abs(parseNumber(item.value)), 0);
}

function maxItem(items) {
  return items.reduce((best, item) => {
    if (!best) return item;
    return parseNumber(item.value) > parseNumber(best.value) ? item : best;
  }, null);
}

function itemText(item) {
  return `${item.item || ''}`.toLowerCase();
}

function matches(text, ...keywords) {
  return keywords.some((keyword) => text.includes(keyword));
}

function normalizeDepartment(department) {
  const normalized = String(department || '').trim().toLowerCase();
  if (normalized === 'hr' || normalized === 'human resources') return 'HR';
  if (normalized === 'sales') return 'Sales';
  if (normalized === 'finance') return 'Finance';
  if (normalized === 'operations') return 'Operations';
  return String(department || '').trim();
}

function insight(label, value) {
  return { label, value };
}

function parseNumber(value) {
  const numericValue = String(value || '').replace(/[^0-9.-]/g, '');
  if (!numericValue || numericValue === '.' || numericValue === '-') return 0;
  const parsed = Number(numericValue);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatPlain(value) {
  if (!Number.isFinite(Number(value))) return '0';
  return String(Math.round(Number(value) * 100) / 100);
}

export function formatNumber(value) {
  if (value === null || value === undefined || value === '') return '-';
  const numberValue = Number(value);
  return Number.isFinite(numberValue)
    ? numberValue.toLocaleString(undefined, { maximumFractionDigits: 2 })
    : value;
}

function toCsv(items) {
  return items.map((item) => item.map(csvCell).join(',')).join('\n');
}

function csvCell(value) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function downloadBlob(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function fileSlug(value) {
  return String(value || 'report')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'report';
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function metricBox(label, value) {
  return `<div class="box"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}
