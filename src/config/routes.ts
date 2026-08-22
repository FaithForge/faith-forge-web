export const APP_ROUTES = {
  auth: {
    login: '/login',
  },
  kidRegistration: {
    root: '/kid-registration',
    new: '/kid-registration/new',
    checkInBase: '/kid-registration/check-in',
    checkInDynamic: '/kid-registration/check-in/:id',
    checkIn: (id: string | number) => `/kid-registration/check-in/${id}`,
  },
  scanner: {
    root: '/scanner',
  },
} as const;
