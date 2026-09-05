export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    ME: "/auth/me",
    LOGOUT: "/auth/logout",
  },
  MENUS: {
    BASE: "/menus",
    BY_ID: (id: string | number) => `/menus/${id}`,
  },
  INVENTORY: {
    MASTER_DATA: "/inventory/master-data",
    ITEM_GROUPS: "/inventory/item-groups",
    ITEM_GROUP_BY_ID: (id: string | number) => `/inventory/item-groups/${id}`,
    ITEMS: "/inventory/items",
    ITEM_BY_ID: (id: string | number) => `/inventory/items/${id}`,
  },
  ACCOUNTS: {
    BASE: "/accounts",
    BY_ID: (id: string | number) => `/accounts/${id}`,
    MASTER_DATA: "/accounts/master-data",
    TYPES: "/accounts/types",
    GROUPS: "/accounts/groups",
  },
  DAYBOOKS: {
    BASE: "/daybooks",
    BY_ID: (id: string | number) => `/daybooks/${id}`,
    GROUPS: "/daybooks/groups",
    GROUP_BY_ID: (id: string | number) => `/daybooks/groups/${id}`,
  },
};
