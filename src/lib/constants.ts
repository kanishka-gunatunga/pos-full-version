/**
 * Application constants
 */

export const APP_NAME = "Ahas Gawwa POS";

/** Auth idle timeout in minutes. */
export const AUTH_IDLE_TIMEOUT_MINUTES = 15;

export const ROUTES = {
  HOME: "/",
  DASHBOARD: "/dashboard",
  DASHBOARD_MENU: "/dashboard/menu",
  DASHBOARD_ORDERS: "/dashboard/orders",
  DASHBOARD_PAYMENTS: "/dashboard/payments",
  DASHBOARD_CUSTOMERS: "/dashboard/customers",
  DASHBOARD_DRAWER: "/dashboard/drawer",
  DASHBOARD_USERS: "/dashboard/users",
  DASHBOARD_INVENTORY: "/dashboard/inventory",
  DASHBOARD_INVENTORY_ADD_PRODUCT: "/dashboard/inventory/add-product",
  DASHBOARD_SUPPLY: "/dashboard/supply",
  DASHBOARD_EXTRA_FEE: "/dashboard/extra-fee",
  DASHBOARD_BRANCHES: "/dashboard/branches",
  DASHBOARD_ACTIVITY: "/dashboard/activity",
  DASHBOARD_VOUCHERS: "/dashboard/vouchers",
  DASHBOARD_VOUCHERS_CREATED: "/dashboard/vouchers/create-vouchers",
  DASHBOARD_REPORTS: "/dashboard/reports",
  DASHBOARD_PROMOTIONS: "/dashboard/promotions",
  DASHBOARD_CALCULATOR: "/dashboard/calculator",
  DASHBOARD_TABLES: "/dashboard/tables",
  ORDERS: "/orders",
  MENU: "/menu",
  TABLES: "/tables",
  REPORTS: "/reports",
  SETTINGS: "/settings",
  KITCHEN: "/kitchen",
} as const;
