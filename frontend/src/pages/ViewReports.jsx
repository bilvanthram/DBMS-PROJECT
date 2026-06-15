import { useEffect, useState } from 'react';
import { Download, Eye, FileSpreadsheet, FileText, Printer, Trash2 } from 'lucide-react';
import { deleteReport, fetchReports } from '../services/api.js';
import { formatDate, formatDateTime } from '../utils/formatters.js';
import { downloadReportAsCsv, downloadReportAsExcel, downloadReportAsPrintHtml } from '../utils/reportUtils.js';

export function ViewReports({ session, onViewDetails }) {
  const [reports, setReports] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    department: '',
    reportType: '',
    status: '',
    dateFrom: '',
    dateTo: '',
  });

  useEffect(() => {
    if (!session) return;

    fetchReports(session)
      .then((nextReports) => {
        setReports(nextReports);
        setError('');
        setMessage('');
      })
      .catch((nextError) => {
        setReports([]);
        setError(nextError.message);
      });
  }, [session]);

  const removeReport = async (event, report) => {
    event.stopPropagation();
    if (!report.id) {
      setError('Cannot delete this report because it has no report id.');
      return;
    }

    const confirmed = window.confirm(`Delete "${report.name}" from the database?`);
    if (!confirmed) return;

    try {
      setDeletingId(report.id);
      await deleteReport(session, report.id);
      setReports((current) => current.filter((candidate) => candidate.id !== report.id));
      setError('');
      setMessage('Report deleted from database');
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setDeletingId(null);
    }
  };

  const updateFilter = (field, value) => {
    setFilters((current) => ({ ...current, [field]: value }));
  };

  const filteredReports = reports.filter((report) => matchesFilters(report, filters));
  const departments = uniqueValues(reports.map((report) => report.department));
  const reportTypes = uniqueValues(reports.map((report) => report.reportType));
  const statuses = uniqueValues(reports.map((report) => report.status || 'COMPLETED'));

  return (
    <div className="content">
      <section className="page-title">
        <h1>View Reports</h1>
        <p>Home / View Reports</p>
      </section>

      <section className="panel">
        <div className="panel-title">
          <FileText size={18} />
          <h2>All Reports</h2>
        </div>
        {error && <div className="auth-message">{error}</div>}
        {message && <div className="auth-message">{message}</div>}
        <div className="report-filters">
          <label className="input-field">
            <span>Search</span>
            <input placeholder="Name, type, department, user" value={filters.search} onChange={(event) => updateFilter('search', event.target.value)} />
          </label>
          <label className="input-field">
            <span>Department</span>
            <select value={filters.department} onChange={(event) => updateFilter('department', event.target.value)}>
              <option value="">All departments</option>
              {departments.map((department) => <option key={department} value={department}>{department}</option>)}
            </select>
          </label>
          <label className="input-field">
            <span>Type</span>
            <select value={filters.reportType} onChange={(event) => updateFilter('reportType', event.target.value)}>
              <option value="">All types</option>
              {reportTypes.map((reportType) => <option key={reportType} value={reportType}>{reportType}</option>)}
            </select>
          </label>
          <label className="input-field">
            <span>Status</span>
            <select value={filters.status} onChange={(event) => updateFilter('status', event.target.value)}>
              <option value="">All statuses</option>
              {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </label>
          <label className="input-field">
            <span>From</span>
            <input type="date" value={filters.dateFrom} onChange={(event) => updateFilter('dateFrom', event.target.value)} />
          </label>
          <label className="input-field">
            <span>To</span>
            <input type="date" value={filters.dateTo} onChange={(event) => updateFilter('dateTo', event.target.value)} />
          </label>
        </div>
        <div className="filter-summary">
          Showing {filteredReports.length} of {reports.length} reports
          <button type="button" className="ghost-inline" onClick={() => setFilters({ search: '', department: '', reportType: '', status: '', dateFrom: '', dateTo: '' })}>
            Clear Filters
          </button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Report Name</th>
                <th>Type</th>
                <th>Date Range</th>
                <th>Generated By</th>
                <th>Generated On</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((report) => (
                <tr className="clickable-record" key={report.id || report.name} onClick={() => onViewDetails(report)}>
                  <td>
                    <button className="report-link" type="button" onClick={(event) => {
                      event.stopPropagation();
                      onViewDetails(report);
                    }}>
                      {report.name}
                    </button>
                  </td>
                  <td>{report.reportType}</td>
                  <td>{report.dateRange || `${formatDate(report.dateFrom)} - ${formatDate(report.dateTo)}`}</td>
                  <td>{report.generatedBy}</td>
                  <td>{formatDateTime(report.generatedOn)}</td>
                  <td><span className="status">{report.status || 'Completed'}</span></td>
                  <td>
                    <div className="actions">
                      <button aria-label="View" onClick={(event) => {
                        event.stopPropagation();
                        onViewDetails(report);
                      }}>
                        <Eye size={14} />
                      </button>
                      <button title="Download CSV" aria-label="Download CSV" onClick={(event) => {
                        event.stopPropagation();
                        downloadReportAsCsv(report);
                      }}>
                        <Download size={14} />
                      </button>
                      <button title="Download Excel" aria-label="Download Excel" onClick={(event) => {
                        event.stopPropagation();
                        downloadReportAsExcel(report);
                      }}>
                        <FileSpreadsheet size={14} />
                      </button>
                      <button title="Print or save PDF" aria-label="Print or save PDF" onClick={(event) => {
                        event.stopPropagation();
                        downloadReportAsPrintHtml(report);
                      }}>
                        <Printer size={14} />
                      </button>
                      <button
                        aria-label="Delete"
                        disabled={deletingId === report.id}
                        onClick={(event) => removeReport(event, report)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!reports.length && <div className="empty-state">No reports created yet.</div>}
          {Boolean(reports.length) && !filteredReports.length && <div className="empty-state">No reports match these filters.</div>}
        </div>
      </section>
    </div>
  );
}

function matchesFilters(report, filters) {
  const search = filters.search.trim().toLowerCase();
  const reportText = [
    report.name,
    report.reportType,
    report.department,
    report.generatedBy,
    report.status,
  ].join(' ').toLowerCase();

  if (search && !reportText.includes(search)) return false;
  if (filters.department && report.department !== filters.department) return false;
  if (filters.reportType && report.reportType !== filters.reportType) return false;
  if (filters.status && (report.status || 'COMPLETED') !== filters.status) return false;
  if (filters.dateFrom && String(report.dateFrom || '') < filters.dateFrom) return false;
  if (filters.dateTo && String(report.dateTo || '') > filters.dateTo) return false;
  return true;
}

function uniqueValues(values) {
  return [...new Set(values.filter(Boolean))].sort((first, second) => first.localeCompare(second));
}
