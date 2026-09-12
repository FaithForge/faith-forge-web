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
      />

      <div className="p-3 sm:p-4 max-w-4xl mx-auto flex flex-col gap-3 flex-1 w-full min-h-0">
        <VolunteerApplicationsTab />
      </div>
    </div>
  );
};

export default VolunteerApplicationsView;
