import apiClient from "@/api/client";
import { endpoints } from "@/api/endpoints";

export interface StaffUser {
  id:            string;
  email:         string;
  role:          string;
  accountStatus: string;
  firstName?:    string | null;
  lastName?:     string | null;
  displayName?:  string | null;
  avatarUrl?:    string | null;
  createdAt:     string;
  lastActiveAt?: string | null;
}

export interface LearnerUser extends StaffUser {
  grade?:    number | null;
  province?: string | null;
  school?:   string | null;
}

// Legacy alias
export type TeamUser = StaffUser;

export type InvitableRole = "MANAGER" | "CONTENT_MANAGER" | "REVIEWER";

export const adminService = {
  // ── Dashboard ───────────────────────────────────────────────────────────────
  async getDashboard() {
    const { data } = await apiClient.get(endpoints.admin.dashboard);
    return data;
  },

  // ── Staff ───────────────────────────────────────────────────────────────────
  async getStaff(params?: { role?: InvitableRole; status?: string; page?: number }) {
    const { data } = await apiClient.get(endpoints.admin.staff, { params });
    return data as { status: string; data: { users: StaffUser[]; pagination: any } };
  },

  async inviteStaffMember(payload: {
    email:      string;
    firstName?: string;
    lastName?:  string;
    role:       InvitableRole;
  }) {
    const { data } = await apiClient.post(endpoints.admin.staffInvite, payload);
    return data;
  },

  // ── Learners ────────────────────────────────────────────────────────────────
  async getLearners(params?: { status?: string; page?: number }) {
    const { data } = await apiClient.get(endpoints.admin.learners, { params });
    return data as { status: string; data: { users: LearnerUser[]; pagination: any } };
  },

  // ── Per-user actions ────────────────────────────────────────────────────────
  async updateUserStatus(id: string, status: string) {
    const { data } = await apiClient.patch(endpoints.admin.userStatus(id), { status });
    return data;
  },

  async updateUserRole(id: string, role: string) {
    const { data } = await apiClient.patch(endpoints.admin.userRole(id), { role });
    return data;
  },

  async deleteUser(id: string) {
    const { data } = await apiClient.delete(`/admin/users/${id}`);
    return data;
  },

  // ── Legacy helpers (used by existing pages) ─────────────────────────────────
  async getManagers() {
    return this.getStaff({ role: "MANAGER" });
  },

  async inviteManager(email: string) {
    return this.inviteStaffMember({ email, role: "MANAGER" });
  },

  async getUsers(params?: { role?: string; status?: string; page?: number }) {
    const { data } = await apiClient.get(endpoints.admin.users, { params });
    return data;
  },
};
