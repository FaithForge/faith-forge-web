import React from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/ui/PageHeader';
import { APP_ROUTES } from '@/config/routes';
import { VolunteerApplicationsTab } from './components/VolunteerApplicationsTab';

/**
 * Independent view for Volunteer Applications at /admin/volunteers/applications.
 * Allows administrators and coordinators to review, approve, and reject server onboarding requests.
 *
 * @returns {JSX.Element} Rendered volunteer applications review view.
 */
const VolunteerApplicationsView: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-full bg-slate-50 pb-20 flex flex-col flex-1">
      <PageHeader
        title="Solicitudes de Servidores"
        onBack={() => navigate(APP_ROUTES.admin.root)}
        className="lg:hidden"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 flex flex-col gap-5 flex-1 w-full">
        <VolunteerApplicationsTab />
      </div>
    </div>
  );
};

export default VolunteerApplicationsView;
