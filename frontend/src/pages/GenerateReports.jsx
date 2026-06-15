import { useRef, useState } from 'react';
import { createReport, createReportFromCsv } from '../services/api.js';
import { buildDepartmentInsights, formatNumber, parseCsvText, summarizeItems } from '../utils/reportUtils.js';

export function GenerateReports({ session, onCreated }) {
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({
    name: '',
    reportType: '',
    department: 'General',
    format: 'PDF',
    dateFrom: new Date().toISOString().slice(0, 10),
    dateTo: new Date().toISOString().slice(0, 10),
    description: '',
  });
  const [dataItems, setDataItems] = useState([
    { item: '', value: '' },
  ]);
  const [csvFile, setCsvFile] = useState(null);
  const [csvItems, setCsvItems] = useState([]);
  const [csvError, setCsvError] = useState('');
  const [message, setMessage] = useState('');

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const updateDataItem = (index, field, value) => {
    setDataItems((current) => current.map((item, itemIndex) => (
      itemIndex === index ? { ...item, [field]: value } : item
    )));
  };
  const addDataItem = () => {
    setDataItems((current) => [...current, { item: '', value: '' }]);
  };
  const removeDataItem = (index) => {
    setDataItems((current) => current.length === 1
      ? current
      : current.filter((_, itemIndex) => itemIndex !== index));
  };
  const clearCsvFile = () => {
    setCsvFile(null);
    setCsvItems([]);
    setCsvError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  const loadCsvFile = (file) => {
    setCsvFile(file || null);
    setCsvItems([]);
    setCsvError('');
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        setCsvItems(parseCsvText(reader.result));
        setCsvError('');
      } catch (error) {
        setCsvItems([]);
        setCsvError(error.message);
      }
    };
    reader.onerror = () => {
      setCsvError('Could not read selected CSV file');
    };
    reader.readAsText(file);
  };

  const submit = async () => {
    const filledItems = dataItems.filter((item) => item.item || item.value);
    const reportPayload = {
      name: form.name,
      reportType: form.reportType,
      department: form.department,
      format: form.format,
      description: form.description,
      dateFrom: form.dateFrom,
      dateTo: form.dateTo,
    };
    const validationMessage = validateReportForm(reportPayload, csvFile, csvError, filledItems, session);

    if (validationMessage) {
      setMessage(validationMessage);
      return;
    }

    try {
      if (csvFile) {
        await createReportFromCsv(session, reportPayload, csvFile);
      } else {
        await createReport(session, {
          ...reportPayload,
          reportData: JSON.stringify(filledItems),
        });
      }
      setMessage('Report created successfully');
      onCreated?.();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const example = departmentExample(form.department);
  const previewItems = csvFile ? csvItems : dataItems.filter((item) => item.item || item.value);
  const previewSummary = summarizeItems(previewItems);
  const previewInsights = buildDepartmentInsights(form.department, previewItems);

  return (
    <div className="content">
      <section className="page-title">
        <h1>Create Report</h1>
      </section>

      <section className="panel form-panel">
        <form className="create-report-form">
          <label className="input-field">
            <span>Report Name*</span>
            <input placeholder="Enter report name" value={form.name} onChange={(event) => update('name', event.target.value)} />
          </label>

          <label className="input-field">
            <span>Report Type*</span>
            <select value={form.reportType} onChange={(event) => update('reportType', event.target.value)}>
              <option value="">Select report type</option>
              <option value="Sales">Sales</option>
              <option value="HR">HR</option>
              <option value="Finance">Finance</option>
              <option value="Operations">Operations</option>
            </select>
          </label>

          <label className="input-field">
            <span>Department*</span>
            <select value={form.department} onChange={(event) => update('department', event.target.value)}>
              <option value="General">General</option>
              <option value="Sales">Sales</option>
              <option value="Human Resources">Human Resources</option>
              <option value="Finance">Finance</option>
              <option value="Operations">Operations</option>
              <option value="Marketing">Marketing</option>
            </select>
          </label>

          <label className="input-field">
            <span>Format*</span>
            <select value={form.format} onChange={(event) => update('format', event.target.value)}>
              <option value="PDF">PDF</option>
              <option value="XLSX">XLSX</option>
              <option value="CSV">CSV</option>
            </select>
          </label>

          <div className="date-fields">
            <label className="input-field">
              <span>Date From*</span>
              <input type="date" value={form.dateFrom} onChange={(event) => update('dateFrom', event.target.value)} />
            </label>

            <label className="input-field">
              <span>Date To*</span>
              <input type="date" value={form.dateTo} onChange={(event) => update('dateTo', event.target.value)} />
            </label>
          </div>

          <label className="input-field">
            <span>Report Description*</span>
            <textarea placeholder="Enter report description" value={form.description} onChange={(event) => update('description', event.target.value)} />
          </label>

          <label className="input-field">
            <span>Upload CSV Data</span>
            <input ref={fileInputRef} type="file" accept=".csv,text/csv" onChange={(event) => loadCsvFile(event.target.files?.[0])} />
          </label>

          <div className="report-data-editor">
            <div className="form-section-title">
              <span>{csvFile ? `Selected CSV: ${csvFile.name}` : 'Manual Values*'}</span>
              {csvFile ? (
                <button type="button" className="ghost-inline" onClick={clearCsvFile}>Enter Manually</button>
              ) : (
                <button type="button" className="ghost-inline" onClick={addDataItem}>Add Item</button>
              )}
            </div>

            {!csvFile && dataItems.map((dataItem, index) => (
              <div className="report-value-entry" key={index}>
                <label className="input-field">
                  <span>Item</span>
                  <input placeholder={example.item} value={dataItem.item} onChange={(event) => updateDataItem(index, 'item', event.target.value)} />
                </label>
                <label className="input-field">
                  <span>Value</span>
                  <input placeholder={example.value} value={dataItem.value} onChange={(event) => updateDataItem(index, 'value', event.target.value)} />
                </label>
                {dataItems.length > 1 && (
                  <button className="remove-entry" type="button" onClick={() => removeDataItem(index)}>Remove</button>
                )}
              </div>
            ))}
          </div>

          <div className="report-preview">
            <div className="form-section-title">
              <span>Report Preview</span>
              <small>{csvFile ? 'CSV loaded' : 'Manual value'}</small>
            </div>

            {csvError && <div className="auth-message">{csvError}</div>}

            <div className="preview-metrics">
              <PreviewMetric label="Total Value" value={formatNumber(previewSummary.total)} />
              <PreviewMetric label="Average Value" value={formatNumber(previewSummary.average)} />
              <PreviewMetric label="Highest Item" value={previewSummary.highestItem} />
            </div>

            <div className="report-content">
              <div className="section-kicker">Department Insights</div>
              <div className="insight-grid compact-insights">
                {previewInsights.map((insight) => (
                  <PreviewMetric key={insight.label} label={insight.label} value={formatNumber(insight.value)} />
                ))}
              </div>
            </div>
          </div>

          {message && <div className="auth-message">{message}</div>}
          <button className="primary-action full" type="button" onClick={submit}>Create Report</button>
        </form>
      </section>
    </div>
  );
}

function validateReportForm(report, csvFile, csvError, filledItems, session) {
  if (!session?.token) return 'Please sign in again before creating reports';
  if (!report.name.trim()) return 'Report name is required';
  if (!report.reportType.trim()) return 'Report type is required';
  if (!report.department.trim()) return 'Department is required';
  if (!report.format.trim()) return 'Format is required';
  if (!report.description.trim()) return 'Report description is required';
  if (!report.dateFrom || !report.dateTo) return 'Date range is required';
  if (report.dateFrom > report.dateTo) return 'Date From cannot be after Date To';
  if (csvFile && csvError) return csvError;
  if (!csvFile && !filledItems.length) return 'Report data must include at least one item';
  return '';
}

function PreviewMetric({ label, value }) {
  return (
    <div className="detail-item preview-item">
      <span>{label}</span>
      <strong>{value || '-'}</strong>
    </div>
  );
}

function departmentExample(department) {
  if (department === 'Finance') {
    return {
      item: 'Example: Revenue or Expense',
      value: 'Example: 85000 or -12000',
    };
  }

  if (department === 'Sales') {
    return {
      item: 'Example: Product sales or Target',
      value: 'Example: 125000',
    };
  }

  if (department === 'Human Resources') {
    return {
      item: 'Example: Hired, Resigned, Payroll',
      value: 'Example: 12',
    };
  }

  if (department === 'Operations') {
    return {
      item: 'Example: Completed or Pending',
      value: 'Example: 430',
    };
  }

  return {
    item: 'Example: North region',
    value: 'Example: 48200',
  };
}
