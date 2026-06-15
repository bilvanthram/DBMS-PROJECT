import { ChevronDown, ClipboardPenLine, FileText, Home, LogOut, UserRound } from 'lucide-react';

const navItems = [
  ['dashboard', 'Dashboard', Home],
  ['generateReports', 'Create Report', ClipboardPenLine],
  ['viewReports', 'View Reports', FileText],
];

export function Navbar({ activePage, session, onChangePage, onLogout, children }) {
  if (!session) {
    return children;
  }

  const userName = session?.fullName || 'User';

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <LogoMark />
          <span><strong>ReportFlow</strong></span>
        </div>

        <nav>
          {navItems.map(([page, label, Icon]) => (
            <button
              className={activePage === page ? 'nav-item active' : 'nav-item'}
              key={page}
              onClick={() => onChangePage(page)}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <button className="logout" onClick={onLogout}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div />
          <div className="topbar-actions">
            <div className="avatar"><UserRound size={19} /></div>
            <strong>{userName}</strong>
            <ChevronDown size={16} />
          </div>
        </header>

        {children}
      </section>
    </main>
  );
}

export function LogoMark() {
  return (
    <span className="logo-lockup" aria-label="ReportFlow">
      <span className="logo-orbit orbit-a" />
      <span className="logo-orbit orbit-b" />
      <span className="logo-orbit orbit-c" />
      <span className="brand-mark">
        <ClipboardPenLine size={18} />
      </span>
    </span>
  );
}
