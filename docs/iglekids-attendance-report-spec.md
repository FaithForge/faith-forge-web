# Especificación Técnica: Reporte de Asistencia Oficial de Iglekids (PDF)

> **Documento de Requerimientos y Contrato de Integración**  
> **Microservicio Responsable**: `kid-church`  
> **Consumidor**: Frontend Web SPA (`faith-forge-web` / Iglekids Web)  
> **Generación de PDF**: 100% Client-side (Frontend con `jsPDF` + `jspdf-autotable`)

---

## 1. Contexto y Propósito

El presente documento detalla la estructura, diseño visual y especificación formal de la API para el **Reporte Oficial de Asistencia de Servicios de Iglekids**.

El reporte tiene un enfoque puramente **estadístico, analítico y de control operativo**, diseñado para pastores, directores de sede y coordinadores de salones de niños. No requiere firmas ni aprobaciones formales.

---

## 2. Estructura y Diseño Visual del Reporte PDF

### 2.1 Paleta de Color y Guía de Estilo
* **Primario Institucional**: `#7C3AED` (Violeta Iglekids)
* **Acento Femenino**: `#EC4899` (Rosa)
* **Acento Masculino**: `#3B82F6` (Azul)
* **Atención / Alertas Médicas**: `#EF4444` (Rojo)
* **Nuevos / Primera Vez**: `#F59E0B` (Ámbar)
* **Fondos de Contraste**: `#F8FAFC` (Gris claro)

### 2.2 Wireframe y Jerarquía del Documento

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [LOGO IGLEKIDS]    IGLESIA CRISTIANA CENTRO DE FE                          [ID REPORTE]│
│                    Sistema de Gestión Iglekids                             #2026-0829-01│
├────────────────────────────────────────────────────────────────────────────────────────┤
│ █ BANNER DESTACADO DEL SERVICIO                                                        │
│ ┌──────────────────────┬──────────────────────┬──────────────────────┬───────────────┐ │
│ │ SEDE:                │ SERVICIO:            │ DÍA:                 │ FECHA:        │ │
│ │ Sede Central         │ Domingo 10:00 AM     │ ★ DOMINGO            │ 29 Ago 2026   │ │
│ └──────────────────────┴──────────────────────┴──────────────────────┴───────────────┘ │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 1. TOTALES GENERALES (KPIs)                                                            │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌────────────────────────┐ │
│ │Total Registrados│ │      Nuevos     │ │   Recurrentes   │ │    Salón con Mayor     │ │
│ │       25        │ │     0 (0%)      │ │    25 (100%)    │ │ Afluencia: Jeremías  │ │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘ └────────────────────────┘ │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 2. ANÁLISIS VISUAL Y MÉTRICAS ESTADÍSTICAS                                             │
│                                                                                        │
│  [A] Distribución por Salón               [B] Género         [C] Picos de Llegada      │
│  Jeremias      ████████ 6 (24%)           M:  8 (32%) [Azul]  08:30-08:45: ■■ 3 (12%)  │
│  Yo Soy Iglek. ███████  5 (20%)           F: 17 (68%) [Rosa]  08:45-09:00: ■■■■■■ 14(56│
│  Zaqueos       ███████  5 (20%)                               09:00-09:15: ■■■■ 6 (24%)│
│  Timoteos      ████     3 (12%)                               09:15-09:30: ■ 2 (8%)    │
│  Caminadores   ████     3 (12%)                                                        │
│  Titos         ███      2 (8%)                                                         │
│  Bebes         █        1 (4%)                                                         │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 3. LISTADO NOMINAL DETALLADO DE ASISTENCIA (Agrupado por Salón)                        │
│ ┌───┬─────────┬─────────────────────────┬──────┬─────────┬──────────────┬────────────┐ │
│ │ # │ Ingreso │ Nombre del Niño(a)      │ Edad │ Tipo    │ Acudiente    │ Teléfono   │ │
│ ├───┼─────────┼─────────────────────────┼──────┼─────────┼──────────────┼────────────┤ │
│ │ ■ SALÓN: Jeremias (6 niños)                                                        │ │
│ │ 1 │ 08:42 AM│ Lucas David Gómez       │ 6 a  │ Reg.    │ María Pérez  │ 3001234567 │ │
│ │ 2 │ 08:47 AM│ Mateo Alejandro Díaz    │ 7 a  │ Reg.    │ Juan Díaz    │ 3109876543 │ │
│ │ 3 │ 08:51 AM│ Samuel Rodríguez        │ 7 a  │ Reg. ⚠  │ Carlos R.    │ 3005551122 │ │
│ └───┴─────────┴─────────────────────────┴──────┴─────────┴──────────────┴────────────┘ │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 4. RESUMEN DE ALERTAS MÉDICAS Y CUIDADOS ESPECIALES (Casos Detectados: 2)              │
│ ┌──────────────┬──────────────────┬──────────────────────┬───────────────────────────┐ │
│ │ Salón        │ Niño(a)          │ Condición / Alergia  │ Teléfono Contacto Tutor   │ │
│ ├──────────────┼──────────────────┼──────────────────────┼───────────────────────────┤ │
│ │ Jeremias     │ Samuel Rodríguez │ Alergia Frutos Secos │ Carlos R. (300 555 1122)  │ │
│ │ Zaqueos      │ Valeria Martínez │ Asma (Usa inhalador) │ Ana M. (311 222 3344)     │ │
│ └──────────────┴──────────────────┴──────────────────────┴───────────────────────────┘ │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Iglekids Cloud • Generado el 29/08/2026 a las 12:35 PM                    Página 1 de 2│
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Especificación del Endpoint (Backend - `kid-church`)

### 3.1 Información del Endpoint
* **Microservicio**: `kid-church`
* **Método**: `GET`
* **Path**: `/report/kid-church-meeting/attendance-detail`
* **Headers**:
  * `Authorization: Bearer <JWT>`
  * `Content-Type: application/json`

### 3.2 Parámetros de Consulta (Query Params)

| Parámetro | Tipo | Requerido | Descripción | Ejemplo |
| :--- | :--- | :---: | :--- | :--- |
| `churchMeetingId` | `string (UUID)` | **Sí** | Identificador único de la reunión/servicio. | `a8b2c3d4-e5f6-7890-abcd-1234567890ab` |
| `date` | `string (YYYY-MM-DD)` | **Sí** | Fecha en la que ocurrió el servicio. | `2026-08-29` |
| `kidGroupId` | `string (UUID)` | *No* | Filtrar por un salón específico en caso de desear el reporte exclusivo de ese salón. | `g-jeremias-uuid` |

---

### 3.3 Esquema de Respuesta JSON (200 OK)

```json
{
  "status": "success",
  "data": {
    "metadata": {
      "church": {
        "id": "74b3bb5c-208e-4ba4-9b37-d8a6dd60edee",
        "name": "Iglesia Cristiana Centro de Fe"
      },
      "campus": {
        "id": "c1a2b3c4-1111-2222-3333-444455556666",
        "name": "Sede Central"
      },
      "meeting": {
        "id": "a8b2c3d4-e5f6-7890-abcd-1234567890ab",
        "name": "Servicio Domingo 10:00 AM",
        "day": "DOMINGO",
        "initialHour": "10:00:00",
        "finalHour": "12:00:00"
      },
      "reportDate": "2026-08-29",
      "dayName": "DOMINGO",
      "generatedAt": "2026-08-29T12:35:10.000Z"
    },
    "summary": {
      "totalKids": 25,
      "totalNewKids": 0,
      "totalReturningKids": 25,
      "totalWithMedicalAlerts": 2,
      "byGender": [
        { "gender": "M", "label": "Masculino", "count": 8, "percentage": 32.0 },
        { "gender": "F", "label": "Femenino", "count": 17, "percentage": 68.0 }
      ],
      "byKidGroup": [
        { "groupId": "g-jeremias", "groupName": "Jeremias", "count": 6, "percentage": 24.0 },
        { "groupId": "g-iglekids", "groupName": "Yo Soy Iglekids", "count": 5, "percentage": 20.0 },
        { "groupId": "g-zaqueos", "groupName": "Zaqueos", "count": 5, "percentage": 20.0 },
        { "groupId": "g-timoteos", "groupName": "Timoteos", "count": 3, "percentage": 12.0 },
        { "groupId": "g-caminadores", "groupName": "Caminadores", "count": 3, "percentage": 12.0 },
        { "groupId": "g-titos", "groupName": "Titos", "count": 2, "percentage": 8.0 },
        { "groupId": "g-bebes", "groupName": "Bebes", "count": 1, "percentage": 4.0 }
      ],
      "checkInTimeSlots": [
        { "slot": "08:30 - 08:45", "count": 3, "percentage": 12.0 },
        { "slot": "08:45 - 09:00", "count": 14, "percentage": 56.0 },
        { "slot": "09:00 - 09:15", "count": 6, "percentage": 24.0 },
        { "slot": "09:15 - 09:30", "count": 2, "percentage": 8.0 }
      ]
    },
    "attendees": [
      {
        "registrationId": "reg-101",
        "checkInTime": "2026-08-29T08:42:15.000Z",
        "checkInTimeFormatted": "08:42 AM",
        "kid": {
          "id": "k-01",
          "faithForgeId": 1042,
          "firstName": "Lucas David",
          "lastName": "Gómez",
          "gender": "M",
          "age": 6,
          "isFirstTime": false,
          "birthday": "2020-05-10"
        },
        "group": {
          "id": "g-jeremias",
          "name": "Jeremias"
        },
        "guardian": {
          "id": "gua-01",
          "fullName": "María Pérez",
          "relation": "Madre",
          "phone": "3001234567",
          "dialCodePhone": "+57"
        },
        "medicalCondition": null,
        "observations": "Sin observaciones",
        "registeredBy": "Lina Gómez"
      },
      {
        "registrationId": "reg-102",
        "checkInTime": "2026-08-29T08:51:00.000Z",
        "checkInTimeFormatted": "08:51 AM",
        "kid": {
          "id": "k-02",
          "faithForgeId": 1055,
          "firstName": "Samuel",
          "lastName": "Rodríguez",
          "gender": "M",
          "age": 7,
          "isFirstTime": false,
          "birthday": "2019-03-15"
        },
        "group": {
          "id": "g-jeremias",
          "name": "Jeremias"
        },
        "guardian": {
          "id": "gua-02",
          "fullName": "Carlos Rodríguez",
          "relation": "Padre",
          "phone": "3005551122",
          "dialCodePhone": "+57"
        },
        "medicalCondition": {
          "hasCondition": true,
          "name": "Alergia a Frutos Secos",
          "description": "Cargar Epipen en la maleta"
        },
        "observations": "Dejó maleta azul en estante 3",
        "registeredBy": "Lina Gómez"
      }
    ],
    "medicalAlerts": [
      {
        "kidId": "k-02",
        "kidFullName": "Samuel Rodríguez",
        "groupName": "Jeremias",
        "conditionName": "Alergia a Frutos Secos",
        "description": "Cargar Epipen en la maleta",
        "guardianName": "Carlos Rodríguez (Padre)",
        "guardianPhone": "+57 3005551122"
      },
      {
        "kidId": "k-03",
        "kidFullName": "Valeria Martínez",
        "groupName": "Zaqueos",
        "conditionName": "Asma",
        "description": "Inhalador salbutamol",
        "guardianName": "Ana Martínez (Madre)",
        "guardianPhone": "+57 3112223344"
      }
    ]
  }
}
```

---

## 4. Reglas de Negocio para el Backend

1. **Nombre de la Iglesia**: 
   * Extraer `church.name` mediante la relación de `churchCampus` con `church`.
2. **Día de la Semana Resaltado**:
   * Enviar `metadata.dayName` en mayúsculas (ej. `DOMINGO`, `MIÉRCOLES`, `SÁBADO`) para su colocación destacada en el encabezado.
3. **Picos de Llegada (`checkInTimeSlots`)**:
   * Agrupar las marcas temporales (`checkInTime` o `createdAt` del registro) en intervalos de 15 minutos (ej. `08:30 - 08:45`, `08:45 - 09:00`, etc.).
4. **Casos Médicos (`medicalAlerts`)**:
   * Filtrar automáticamente todos los registros del servicio donde el niño posea `medicalCondition != null` para poblar el anexo final de seguridad.

---

## 5. Modelado en Frontend (`src/libs/models`)

```typescript
export interface IAttendanceReportAttendee {
  registrationId: string;
  checkInTime: string;
  checkInTimeFormatted: string;
  kid: {
    id: string;
    faithForgeId?: number;
    firstName: string;
    lastName: string;
    gender: 'M' | 'F';
    age: number;
    isFirstTime: boolean;
    birthday?: string;
  };
  group: {
    id: string;
    name: string;
  };
  guardian: {
    id: string;
    fullName: string;
    relation: string;
    phone: string;
    dialCodePhone: string;
  };
  medicalCondition?: {
    hasCondition: boolean;
    name: string;
    description?: string;
  } | null;
  observations?: string;
  registeredBy?: string;
}

export interface IAttendanceReportData {
  metadata: {
    church: { id: string; name: string };
    campus: { id: string; name: string };
    meeting: { id: string; name: string; day?: string; initialHour?: string; finalHour?: string };
    reportDate: string;
    dayName: string;
    generatedAt: string;
  };
  summary: {
    totalKids: number;
    totalNewKids: number;
    totalReturningKids: number;
    totalWithMedicalAlerts: number;
    byGender: Array<{ gender: string; label: string; count: number; percentage: number }>;
    byKidGroup: Array<{ groupId: string; groupName: string; count: number; percentage: number }>;
    checkInTimeSlots: Array<{ slot: string; count: number; percentage: number }>;
  };
  medicalAlerts: Array<{
    kidId: string;
    kidFullName: string;
    groupName: string;
    conditionName: string;
    description?: string;
    guardianName: string;
    guardianPhone: string;
  }>;
  attendees: IAttendanceReportAttendee[];
}
```
