import { useEffect, useState } from 'react';
import { BadgeDollarSign, CalendarCheck, FileText, Settings2, Users } from 'lucide-react';
import { fetchReports } from '../services/api.js';
import { formatDateTime } from '../utils/formatters.js';

const EMPTY_DEPARTMENT_ACTIVITY = ['HR', 'Sales', 'Operations', 'Finance'].map((department) => ({
  department,
  reportsCreated: 0,
  dataRows: 0,
  totalValue: 0,
  averageValue: 0,
  latestReportName: '',
  latestReportType: '',
  latestInsight: '',
  latestGeneratedBy: '',
  latestActivityAt: '',
}));

export function Dashboard({ session, onChangePage }) {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    if (!session) return;

    let isMounted = true;
    const loadDashboard = () => {
      fetchReports(session)
        .then((nextReports) => {
          if (!isMounted) return;
          setReports(nextReports);
        })
        .catch(() => {
          if (!isMounted) return;
          setReports([]);
        });
    };

    loadDashboard();
    const intervalId = window.setInterval(loadDashboard, 5000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [session]);

  const recentReports = reports.slice(0, 5);
  const reportsThisMonth = reports.filter((report) => isThisMonth(report.generatedOn)).length;
  const departmentActivity = buildDepartmentActivity(reports);

  return (
    <div className="content">
      <section className="page-title">
        <h1>Dashboard</h1>
      </section>

      <section className="metrics">
        <Metric icon={FileText} label="Total Reports" value={reports.length} tone="blue" />
        <Metric icon={CalendarCheck} label="Reports This Month" value={reportsThisMonth} tone="green" />
      </section>

      <section className="panel page-panel">
        <div className="section-heading">
          <h2>Department Activity</h2>
          <span>Live refresh</span>
        </div>
        <div className="department-grid">
          {departmentActivity.map((activity) => (
            <DepartmentActivity key={activity.department} activity={activity} />
          ))}
        </div>
      </section>

      <section className="panel page-panel">
        <h2>Recent Reports</h2>
        <div className="table-wrap simple-table">
          <table>
            <thead>
              <tr>
                <th>Report Name</th>
                <th>Report Type</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              {recentReports.map((report) => (
                <tr key={report.id}>
                  <td>{report.name}</td>
                  <td>{report.reportType}</td>
                  <td>{formatDateTime(report.generatedOn)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!recentReports.length && <div className="empty-state">No reports created yet.</div>}
        </div>
        <button className="secondary-action" type="button" onClick={() => onChangePage('viewReports')}>
          View All Reports
        </button>
      </section>
    </div>
  );
}

function DepartmentActivity({ activity }) {
  const Icon = departmentIcon(activity.department);

  return (
    <article className="department-card">
      <header>
        <span className={`department-icon ${departmentTone(activity.department)}`}>
          <Icon size={22} />
        </span>
        <div>
          <strong>{activity.department}</strong>
        </div>
      </header>

      <dl>
        <div>
          <dt>Reports</dt>
          <dd>{activity.reportsCreated}</dd>
        </div>
        <div>
          <dt>Total</dt>
          <dd>{formatCompactNumber(activity.totalValue)}</dd>
        </div>
        <div>
          <dt>Average</dt>
          <dd>{formatCompactNumber(activity.averageValue)}</dd>
        </div>
      </dl>
    </article>
  );
}

function Metric({ icon: Icon, label, value, tone }) {
  return (
    <article className="metric">
      <div className={`metric-icon ${tone}`}>
        <Icon size={30} />
      </div>
      <div className="metric-copy">
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </article>
  );
}

function buildDepartmentActivity(reports) {
  const departments = new Map(EMPTY_DEPARTMENT_ACTIVITY.map((activity) => [
    activity.department,
    { ...activity },
  ]));

  reports.forEach((report) => {
    const department = normalizeDepartment(report.department);
    const activity = departments.get(department);
    if (!activity) return;

    activity.reportsCreated += 1;
    activity.dataRows += Number(report.dataRowCount || 0);
    activity.totalValue += Number(report.totalValue || 0);

    const currentLatest = activity.latestActivityAt ? new Date(activity.latestActivityAt) : null;
    const reportDate = report.generatedOn ? new Date(report.generatedOn) : null;
    if (reportDate && (!currentLatest || reportDate > currentLatest)) {
      activity.latestReportName = report.name;
      activity.latestReportType = report.reportType;
      activity.latestInsight = report.departmentInsights;
      activity.latestGeneratedBy = report.generatedBy;
      activity.latestActivityAt = report.generatedOn;
    }
  });

  return Array.from(departments.values()).map((activity) => ({
    ...activity,
    averageValue: activity.dataRows ? activity.totalValue / activity.dataRows : 0,
  }));
}

function normalizeDepartment(department) {
  const normalized = String(department || '').trim().toLowerCase();
  if (normalized === 'hr' || normalized === 'human resources') return 'HR';
  if (normalized === 'sales') return 'Sales';
  if (normalized === 'operations') return 'Operations';
  if (normalized === 'finance') return 'Finance';
  return '';
}

function departmentIcon(department) {
  if (department === 'HR') return Users;
  if (department === 'Finance') return BadgeDollarSign;
  return Settings2;
}

function departmentTone(department) {
  if (department === 'HR') return 'people';
  if (department === 'Sales') return 'sales';
  if (department === 'Finance') return 'money';
  return 'ops';
}

function formatCompactNumber(value) {
  const number = Number(value || 0);
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: number % 1 === 0 ? 0 : 2,
  }).format(number);
}

function isThisMonth(value) {
  if (!value) return false;
  const date = new Date(value);
  const now = new Date();
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
}
