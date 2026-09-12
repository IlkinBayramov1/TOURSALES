import { vendorAxiosClient } from '../../shared/api/vendorAxiosClient';
import { VENDOR_ENDPOINTS } from '../../shared/api/vendorEndpoints';

export type TeamRole = 'OWNER' | 'MANAGER' | 'ACCOUNTANT' | 'GUIDE';

export interface AgencyMember {
  id: string;
  userId: string;
  companyId: string;
  name: string;
  email: string;
  role: TeamRole;
  agencyRole?: string;
  phoneNumber?: string;
  status: string; // 'Active' | 'Suspended' | 'Invited'
  lastLoginAt?: string | null;
  createdAt: string;
}

export interface TeamKpis {
  total: number;
  managers: number;
  accountants: number;
  guides: number;
}

export interface TeamMembersResponse {
  members: AgencyMember[];
  kpis: TeamKpis;
}

export interface RolePermissionRow {
  module: string;
  description: string;
  owner: string;
  manager: string;
  accountant: string;
  guide: string;
}

export interface TeamActivityLog {
  id: string;
  entityName: string;
  entityId: string;
  action: string;
  performedBy: string;
  details: string;
  createdAt: string;
}

export const teamApi = {
  getMembers: async (): Promise<TeamMembersResponse> => {
    const res = await vendorAxiosClient.get(VENDOR_ENDPOINTS.TEAM.MEMBERS);
    const data = res.data?.data || res.data;
    if (Array.isArray(data)) {
      return {
        members: data,
        kpis: {
          total: data.length,
          managers: data.filter((m: any) => m.role === 'MANAGER').length,
          accountants: data.filter((m: any) => m.role === 'ACCOUNTANT').length,
          guides: data.filter((m: any) => m.role === 'GUIDE').length,
        },
      };
    }
    return data;
  },

  inviteMember: async (data: {
    email: string;
    name: string;
    phone?: string;
    role: string;
    password?: string;
  }): Promise<AgencyMember> => {
    const res = await vendorAxiosClient.post(VENDOR_ENDPOINTS.TEAM.INVITE, data);
    return res.data?.data || res.data;
  },

  updateMember: async (
    id: string,
    data: { name?: string; phone?: string; role?: string; status?: string }
  ): Promise<AgencyMember> => {
    const res = await vendorAxiosClient.put(VENDOR_ENDPOINTS.TEAM.UPDATE(id), data);
    return res.data?.data || res.data;
  },

  removeMember: async (memberId: string): Promise<void> => {
    await vendorAxiosClient.delete(VENDOR_ENDPOINTS.TEAM.REMOVE(memberId));
  },

  getRolesMatrix: async (): Promise<RolePermissionRow[]> => {
    const res = await vendorAxiosClient.get(VENDOR_ENDPOINTS.TEAM.ROLES);
    return res.data?.data || res.data || [];
  },

  getActivityLogs: async (): Promise<TeamActivityLog[]> => {
    const res = await vendorAxiosClient.get(VENDOR_ENDPOINTS.TEAM.ACTIVITY_LOGS);
    return res.data?.data || res.data || [];
  },
};
