import { describe, it, expect } from 'vitest';
import { AVAILABLE_CODE_MIGRATIONS } from '@/libs/models/codeMigration';
import { hasCapability, CapabilityContext } from '@/libs/utils/auth/capabilities';
import { APP_ROUTES } from '@/config/routes';

describe('AdminSystemOperations & Code Migrations', () => {
  it('registers the expected system operations route in English', () => {
    expect(APP_ROUTES.admin.systemOperations).toBe('/admin/system');
  });

  it('contains the monorepo cheat-sheet migrations with valid microservices', () => {
    expect(AVAILABLE_CODE_MIGRATIONS).toHaveLength(3);

    const microservices = AVAILABLE_CODE_MIGRATIONS.map((m) => m.microservice);
    expect(microservices).toContain('church');
    expect(microservices).toContain('user');
    expect(microservices).toContain('kid-church');

    const churchMig = AVAILABLE_CODE_MIGRATIONS.find((m) => m.microservice === 'church');
    expect(churchMig?.migrationName).toBe('DecoupleChurchMemberIdsFromUserIds1790720000000');

    const userMig = AVAILABLE_CODE_MIGRATIONS.find((m) => m.microservice === 'user');
    expect(userMig?.migrationName).toBe('SyncExistingUsersToChurchMembers1790200001000');

    const kidChurchMig = AVAILABLE_CODE_MIGRATIONS.find((m) => m.microservice === 'kid-church');
    expect(kidChurchMig?.migrationName).toBe('MigrateExistingKidsToUsers1792100001000');
  });

  it('restricts admin:run-code-migrations to SUPER_ADMIN and ADMIN', () => {
    const baseContext: CapabilityContext = {
      isAdmin: false,
      isSuperAdmin: false,
      isMinistryAdmin: false,
      isAreaCoordinator: false,
      isGroupCoordinator: false,
      isSupervisor: false,
      isServidor: false,
      canTakeVolunteerAttendance: false,
      canManageChurchReports: false,
      canViewTeam: false,
      canViewCreatorInfo: false,
      canViewRegistrationLog: false,
    };

    // Regular volunteer / non-admin cannot run migrations
    expect(hasCapability('admin:run-code-migrations', baseContext)).toBe(false);
    expect(hasCapability('admin:manage-system-operations', baseContext)).toBe(false);

    // General Admin can run migrations
    const adminContext = { ...baseContext, isAdmin: true };
    expect(hasCapability('admin:run-code-migrations', adminContext)).toBe(true);
    expect(hasCapability('admin:manage-system-operations', adminContext)).toBe(true);

    // Super Admin can run migrations
    const superAdminContext = { ...baseContext, isSuperAdmin: true };
    expect(hasCapability('admin:run-code-migrations', superAdminContext)).toBe(true);
    expect(hasCapability('admin:manage-system-operations', superAdminContext)).toBe(true);
  });
});
