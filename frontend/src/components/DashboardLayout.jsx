import { Outlet } from 'react-router-dom';
import DashboardNavbar from './DashboardNavbar';

const DashboardLayout = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardNavbar />
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
