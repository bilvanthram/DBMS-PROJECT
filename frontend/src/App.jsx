import { useState } from 'react';
import { Dashboard } from './pages/Dashboard.jsx';
import { GenerateReports } from './pages/GenerateReports.jsx';
import { Navbar } from './components/Navbar.jsx';
import { ReportDetails } from './pages/ReportDetails.jsx';
import { SignIn } from './pages/SignIn.jsx';
import { SignUp } from './pages/SignUp.jsx';
import { ViewReports } from './pages/ViewReports.jsx';
import { Tasks } from './pages/Tasks.jsx';


export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [selectedReport, setSelectedReport] = useState(null);
  const [session, setSession] = useState(() => {
    const saved = localStorage.getItem('reportSession');
    return saved ? JSON.parse(saved) : null;
  });

  const saveSession = (payload) => {
    localStorage.setItem('reportSession', JSON.stringify(payload));
    setSession(payload);
    setActivePage('dashboard');
  };

  const logout = () => {
    localStorage.removeItem('reportSession');
    setSession(null);
    setActivePage('signIn');
  };

  const openReportDetails = (report) => {
    setSelectedReport(report);
    setActivePage('reportDetails');
  };

  const renderPage = () => {
    if (!session && activePage !== 'signUp') {
      return <SignIn onAuth={saveSession} onSignUp={() => setActivePage('signUp')} />;
    }

    if (!session && activePage === 'signUp') {
      return <SignUp onAuth={saveSession} onSignIn={() => setActivePage('signIn')} />;
    }

    if (activePage === 'generateReports') {
      return <GenerateReports session={session} onCreated={() => setActivePage('viewReports')} />;
    }

    if (activePage === 'viewReports') {
      return <ViewReports session={session} onViewDetails={openReportDetails} />;
    }

    if (activePage === 'reportDetails') {
      return <ReportDetails report={selectedReport} onBack={() => setActivePage('viewReports')} />;
    }

    if (activePage === 'tasks') {
      return <Tasks session={session} />;
    }

    return <Dashboard session={session} onChangePage={setActivePage} />;
  };

  return (
    <Navbar
      activePage={activePage}
      session={session}
      onChangePage={setActivePage}
      onLogout={logout}
    >
      {renderPage()}
    </Navbar>
  );
}
