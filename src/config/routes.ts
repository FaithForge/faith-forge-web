export const APP_ROUTES = {
  auth: {
    login: '/login',
  },
  public: {
    volunteerRequest: '/volunteer-request',
  },
  admin: {
    root: '/admin',
    churchMeetings: '/admin/church-meetings',
    createUser: '/admin/users/new',
    users: '/admin/users',
    userDetailDynamic: '/admin/users/:id',
    userDetail: (id: string | number) => `/admin/users/${id}`,
    updateUserDynamic: '/admin/users/edit/:id',
    updateUser: (id: string | number) => `/admin/users/edit/${id}`,
    userRoles: '/admin/users/roles',
    ministries: '/admin/ministries',
    ministryDetailDynamic: '/admin/ministries/:id',
    ministryDetail: (id: string | number) => `/admin/ministries/${id}`,
    volunteers: '/admin/volunteers',
  },
  kidChurch: {
    root: '/kid-church',
    attendance: '/kid-church/attendance',
    report: '/kid-church/report',
  },
  kidRegistration: {
    root: '/kid-registration',
    new: '/kid-registration/new',
    checkInBase: '/kid-registration/check-in',
    checkInDynamic: '/kid-registration/check-in/:id',
    checkIn: (id: string | number) => `/kid-registration/check-in/${id}`,
    updateKidDynamic: '/kid-registration/update-kid/:id',
    updateKid: (id: string | number) => `/kid-registration/update-kid/${id}`,
    scanner: '/kid-registration/scanner',
    generateQR: '/kid-registration/generate-guardian-qr',
  },
} as const;
