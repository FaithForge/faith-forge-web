import ChurchMeetingManager from '@/components/ChurchMeetingManager';
import HomeNavBar from '@/components/navbar/HomeNavBar';
import type { NextPage } from 'next';
import Head from 'next/head';

/**
 * Admin page for managing church meeting states.
 * Renders a campus selector and an editable list of meetings,
 * allowing bulk state updates via the PATCH /church-meeting/bulk-state endpoint.
 */
const ChurchMeetingsAdminPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Gestión de Servicios — Admin</title>
        <meta
          name="description"
          content="Administra el estado de los servicios por sede. Habilita, deshabilita o cambia la visibilidad de los meetings."
        />
      </Head>
      <div className="bg-gray-50 min-h-screen">
        <HomeNavBar />
        <main className="p-2 py-4">
          <ChurchMeetingManager />
        </main>
      </div>
    </>
  );
};

export default ChurchMeetingsAdminPage;
