export const API_ENDPOINTS = {
  MENUS: {
    BASE: "/menus",
    BY_ID: (id: string | number) => `/menus/${id}`,
  },
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
  },
};
