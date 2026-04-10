import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AuthUser = {
    id: string;
    email: string;
    role: string;
    tenantId: string;
    tenantSubdomain?: string; // used to auto-inject X-Tenant-Subdomain in all API requests
    employeeId?: string;
    firstName?: string;
    lastName?: string;
    permissions?: string[]; // temporary permissions for HR: 'settings', 'payroll', 'users_full'
};

interface AuthState {
    user: AuthUser | null;
    token: string | null;
    isAuthenticated: boolean;
    tenantLogo: string | null; // base64 data URL for the company logo
    tenantName: string; // company name for the navbar
    loginState: (user: AuthUser, token: string) => void;
    logoutState: () => void;
    setTenantLogo: (logo: string | null) => void;
    setTenantName: (name: string) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            tenantLogo: null,
            tenantName: 'Harmony',

            loginState: (user, token) => {
                set({ user, token, isAuthenticated: true });
            },

            logoutState: () => {
                set({ user: null, token: null, isAuthenticated: false, tenantLogo: null, tenantName: 'Harmony' });
            },

            setTenantLogo: (logo) => {
                set({ tenantLogo: logo });
            },

            setTenantName: (name) => {
                set({ tenantName: name });
            },
        }),
        {
            name: 'auth-storage',
        }
    )
);
