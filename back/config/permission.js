import { ROLES } from './constants.js';

export const PERMISSIONS = {
  MANAGE_USERS: 'manage_users',
  MANAGE_COMPANIES: 'manage_companies',
  MANAGE_TOURS: 'manage_tours',
  MANAGE_BOOKINGS: 'manage_bookings',
  VIEW_FINANCE: 'view_finance',
  MANAGE_CAMPAIGNS: 'manage_campaigns',
  MANAGE_ADS: 'manage_ads',
  MANAGE_LOYALTY: 'manage_loyalty'
};

export const ROLE_PERMISSIONS = {
  [ROLES.SUPERADMIN]: Object.values(PERMISSIONS),
  [ROLES.VENDOR]: [
    PERMISSIONS.MANAGE_TOURS,
    PERMISSIONS.MANAGE_BOOKINGS,
    PERMISSIONS.VIEW_FINANCE,
    PERMISSIONS.MANAGE_CAMPAIGNS,
    PERMISSIONS.MANAGE_ADS
  ],
  [ROLES.USER]: [
    PERMISSIONS.MANAGE_BOOKINGS
  ]
};

export const hasPermission = (role, permissionOrRole) => {
  if (role === ROLES.SUPERADMIN) return true;
  if (role && role.toLowerCase() === (permissionOrRole || '').toLowerCase()) return true;
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permissionOrRole);
};

export default {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  hasPermission
};
