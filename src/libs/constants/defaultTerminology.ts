/**
 * Catálogo universal de términos institucionales de la iglesia (Nivel Iglesia).
 * Valores neutrales y estándar en español por defecto.
 */
export const DEFAULT_CHURCH_TERMINOLOGY = {
  meeting: 'Reunión',
  meetings: 'Reuniones',
  campus: 'Sede',
  campuses: 'Sedes',
  volunteer: 'Servidor',
  volunteers: 'Servidores',
  small_group: 'Grupo de conexión',
  small_groups: 'Grupos de conexión',
} as const;

export type ChurchTermKey = keyof typeof DEFAULT_CHURCH_TERMINOLOGY;

/**
 * Catálogo de términos operativos por tipo de ministerio (Nivel Ministerio).
 * Scoped estrictamente por MinistryType ('KIDS' | 'GENERAL').
 */
export const DEFAULT_MINISTRY_TERMINOLOGY = {
  KIDS: {
    module_alias: 'Ministerio de Niños',
    registration: 'Registro de niños',
    teacher: 'Maestro(a)',
    teachers: 'Maestros(as)',
    guardian: 'Tutor(a)',
    guardians: 'Tutores',
    classroom: 'Salón',
    classrooms: 'Salones',
  },
  GENERAL: {
    module_alias: 'Ministerio',
    volunteer: 'Servidor',
    volunteers: 'Servidores',
    service_group: 'Grupo de servicio',
    service_groups: 'Grupos de servicio',
  },
} as const;

export type KidsTermKey = keyof typeof DEFAULT_MINISTRY_TERMINOLOGY.KIDS;
export type GeneralMinistryTermKey = keyof typeof DEFAULT_MINISTRY_TERMINOLOGY.GENERAL;

/**
 * Opciones y sugerencias de personalización para el panel de configuración.
 */
export interface TerminologyFieldMeta {
  key: string;
  label: string;
  description: string;
  defaultValue: string;
  suggestedOptions?: string[];
}

export const CHURCH_TERMINOLOGY_FIELDS: TerminologyFieldMeta[] = [
  {
    key: 'meeting',
    label: 'Reunión / Culto',
    description: 'Nombre para las reuniones, cultos o celebraciones principales.',
    defaultValue: DEFAULT_CHURCH_TERMINOLOGY.meeting,
    suggestedOptions: ['Reunión', 'Culto', 'Servicio', 'Celebración'],
  },
  {
    key: 'campus',
    label: 'Sede / Campus',
    description: 'Denominación para las ubicaciones o sedes físicas de la iglesia.',
    defaultValue: DEFAULT_CHURCH_TERMINOLOGY.campus,
    suggestedOptions: ['Sede', 'Campus', 'Filial', 'Local'],
  },
  {
    key: 'volunteer',
    label: 'Servidor / Voluntario',
    description: 'Término institucional para las personas que sirven en la iglesia.',
    defaultValue: DEFAULT_CHURCH_TERMINOLOGY.volunteer,
    suggestedOptions: ['Servidor', 'Voluntario', 'Líder', 'Obrero'],
  },
  {
    key: 'small_group',
    label: 'Grupos Pequeños / Células',
    description: 'Nombre para las células, grupos pequeños o comunidades de hogar.',
    defaultValue: DEFAULT_CHURCH_TERMINOLOGY.small_group,
    suggestedOptions: ['Grupo de conexión', 'Célula', 'Grupo de vida', 'Casa de paz'],
  },
];

export const KIDS_TERMINOLOGY_FIELDS: TerminologyFieldMeta[] = [
  {
    key: 'module_alias',
    label: 'Nombre del Ministerio de Niños',
    description: 'Nombre público y alias del ministerio infantil en la aplicación.',
    defaultValue: DEFAULT_MINISTRY_TERMINOLOGY.KIDS.module_alias,
    suggestedOptions: ['Ministerio de Niños', 'Iglekids', 'Escuela Dominical', 'Iglesia Infantil'],
  },
  {
    key: 'registration',
    label: 'Estación de Entrada / Check-in',
    description: 'Término para la mesa o punto de bienvenida y check-in de niños.',
    defaultValue: DEFAULT_MINISTRY_TERMINOLOGY.KIDS.registration,
    suggestedOptions: ['Registro de niños', 'Regikids', 'Check-in infantil', 'Mesa de entrada'],
  },
  {
    key: 'teacher',
    label: 'Encargado(a) de Clase',
    description: 'Rol de los servidores o maestros que atienden en las aulas.',
    defaultValue: DEFAULT_MINISTRY_TERMINOLOGY.KIDS.teacher,
    suggestedOptions: ['Maestro(a)', 'Servidor(a)', 'Profesor(a)', 'Tía / Tío', 'Monitor(a)'],
  },
  {
    key: 'guardian',
    label: 'Adulto Responsable',
    description: 'Término para el padre, tutor legal o acudiente responsable del niño.',
    defaultValue: DEFAULT_MINISTRY_TERMINOLOGY.KIDS.guardian,
    suggestedOptions: ['Tutor(a)', 'Representante', 'Acudiente', 'Padre / Madre'],
  },
  {
    key: 'classroom',
    label: 'Espacio de Aprendizaje',
    description: 'Denominación para las aulas o salones divididos por edad.',
    defaultValue: DEFAULT_MINISTRY_TERMINOLOGY.KIDS.classroom,
    suggestedOptions: ['Salón', 'Aula', 'Clase', 'Nivel'],
  },
];

export const GENERAL_MINISTRY_TERMINOLOGY_FIELDS: TerminologyFieldMeta[] = [
  {
    key: 'module_alias',
    label: 'Nombre o Alias del Ministerio',
    description: 'Nombre visible de este ministerio en la interfaz.',
    defaultValue: DEFAULT_MINISTRY_TERMINOLOGY.GENERAL.module_alias,
    suggestedOptions: ['Alabanza', 'Logística', 'Consolidación', 'Ujieres', 'Multimedia'],
  },
  {
    key: 'volunteer',
    label: 'Rol del Servidor en este Ministerio',
    description: 'Término específico para quienes sirven en este ministerio.',
    defaultValue: DEFAULT_MINISTRY_TERMINOLOGY.GENERAL.volunteer,
    suggestedOptions: ['Servidor', 'Ujier', 'Músico', 'Vocalista', 'Técnico', 'Anfitrión'],
  },
  {
    key: 'service_group',
    label: 'Nombre del Equipo de Servicio',
    description: 'Denominación para los equipos o turnos operativos.',
    defaultValue: DEFAULT_MINISTRY_TERMINOLOGY.GENERAL.service_group,
    suggestedOptions: ['Equipo de servicio', 'Banda', 'Turno', 'Grupo'],
  },
];

