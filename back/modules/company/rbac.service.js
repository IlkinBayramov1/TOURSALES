import ApiError from '../../core/api.error.js';

export const AGENCY_ROLES = {
  OWNER: 'AgencyOwner',
  ADMIN: 'AgencyAdmin',
  AGENT: 'SalesAgent',
  ACCOUNTANT: 'Accountant',
  GUIDE: 'Guide'
};

export const PERMISSIONS = {
  CREATE_TOUR: 'CREATE_TOUR',
  EDIT_TOUR: 'EDIT_TOUR',
  DELETE_TOUR: 'DELETE_TOUR',
  CREATE_BOOKING: 'CREATE_BOOKING',
  CANCEL_BOOKING: 'CANCEL_BOOKING',
  VIEW_FINANCE: 'VIEW_FINANCE',
  REQUEST_PAYOUT: 'REQUEST_PAYOUT',
  SCAN_VOUCHER: 'SCAN_VOUCHER',
  MANAGE_TEAM: 'MANAGE_TEAM'
};

class RbacService {
  constructor() {
    this.rolePermissions = {
      [AGENCY_ROLES.OWNER]: Object.values(PERMISSIONS),
      [AGENCY_ROLES.ADMIN]: [
        PERMISSIONS.CREATE_TOUR,
        PERMISSIONS.EDIT_TOUR,
        PERMISSIONS.CREATE_BOOKING,
        PERMISSIONS.CANCEL_BOOKING,
        PERMISSIONS.VIEW_FINANCE,
        PERMISSIONS.SCAN_VOUCHER
      ],
      [AGENCY_ROLES.AGENT]: [
        PERMISSIONS.CREATE_BOOKING,
        PERMISSIONS.CANCEL_BOOKING
      ],
      [AGENCY_ROLES.ACCOUNTANT]: [
        PERMISSIONS.VIEW_FINANCE,
        PERMISSIONS.REQUEST_PAYOUT
      ],
      [AGENCY_ROLES.GUIDE]: [
        PERMISSIONS.SCAN_VOUCHER
      ]
    };
  }

  hasPermission(role, permission) {
    const permissions = this.rolePermissions[role] || [];
    return permissions.includes(permission);
  }

  authorize(role, permission) {
    if (!this.hasPermission(role, permission)) {
      throw ApiError.forbidden(`Giriş qadağandır: '${role}' rolunun '${permission}' icazəsi yoxdur.`);
    }
    return true;
  }
}

export const rbacService = new RbacService();
export default rbacService;
