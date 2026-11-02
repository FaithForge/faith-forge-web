export type CodeMigrationMicroservice = 'church' | 'user' | 'kid-church';

export type CodeMigrationStatus =
  | 'ALREADY_COMPLETED'
  | 'EXECUTED'
  | 'NOT_FOUND'
  | 'FAILED';

export interface ICodeMigrationResult {
  name: string;
  microservice: CodeMigrationMicroservice;
  status: CodeMigrationStatus;
  executedAt?: string;
  durationMs?: number;
  message: string;
  availableMigrations?: string[];
  error?: string;
}

export interface IRunCodeMigrationPayload {
  microservice: CodeMigrationMicroservice;
  migrationName: string;
  force?: boolean;
}

export interface IRunCodeMigrationResponse {
  success: boolean;
  result: ICodeMigrationResult;
}

export interface IAvailableCodeMigration {
  microservice: CodeMigrationMicroservice;
  migrationName: string;
  descriptionKey: string;
  defaultDescription: string;
}

export const AVAILABLE_CODE_MIGRATIONS: IAvailableCodeMigration[] = [
  {
    microservice: 'church',
    migrationName: 'DecoupleChurchMemberIdsFromUserIds1790720000000',
    descriptionKey: 'admin:system_operations.migrations.cheat_sheet.church_decouple_desc',
    defaultDescription:
      'Desacopla IDs de miembros de iglesia de los IDs de usuario.',
  },
  {
    microservice: 'user',
    migrationName: 'SyncExistingUsersToChurchMembers1790200001000',
    descriptionKey: 'admin:system_operations.migrations.cheat_sheet.user_sync_desc',
    defaultDescription:
      'Sincroniza usuarios con documento a miembros de iglesia.',
  },
  {
    microservice: 'kid-church',
    migrationName: 'MigrateExistingKidsToUsers1792100001000',
    descriptionKey: 'admin:system_operations.migrations.cheat_sheet.kid_church_migrate_desc',
    defaultDescription:
      'Crea y vincula usuarios para registros legacy de niños.',
  },
];
