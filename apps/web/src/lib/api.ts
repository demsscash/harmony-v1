import axios from 'axios';
import Cookies from 'js-cookie';
import { useAuthStore } from '@/store/authStore';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Helper: clear session — providers.tsx detects isAuthenticated=false and redirects via router (no hard reload)
const handleForceLogout = () => {
    Cookies.remove('accessToken');
    useAuthStore.getState().logoutState();
};

// Interceptor request: attach token + tenant subdomain
api.interceptors.request.use((config) => {
    // Attach access token
    if (!config.headers.Authorization) {
        const token = Cookies.get('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }

    // Inject tenant subdomain so the backend tenantResolver works from localhost
    if (!config.headers['X-Tenant-Subdomain']) {
        const authState = typeof window !== 'undefined' ? useAuthStore.getState() : null;
        const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
        const isLocalhost = hostname === 'localhost' || hostname.startsWith('127.');
        const hostPart = !isLocalhost && hostname.includes('.') ? hostname.split('.')[0] : null;
        const subdomain = authState?.user?.tenantSubdomain || hostPart || 'demo';
        config.headers['X-Tenant-Subdomain'] = subdomain;
    }

    return config;
});

// Interceptor response: 401 → refresh → retry, or force logout (no hard redirect)
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (!error.response) {
            return Promise.reject(error);
        }

        const status = error.response.status;
        const url = originalRequest?.url || '';

        // Prevent infinite loop: if the refresh call itself failed, logout
        if (url.includes('/auth/refresh')) {
            handleForceLogout();
            return Promise.reject(error);
        }

        // 401: try to refresh token once
        if (status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshResponse = await axios.post(
                    `${API_BASE_URL}/auth/refresh`,
                    {},
                    { withCredentials: true }
                );

                if (refreshResponse.data?.success && refreshResponse.data?.data?.accessToken) {
                    const newToken = refreshResponse.data.data.accessToken;
                    Cookies.set('accessToken', newToken, { expires: 1 / 96, secure: window.location.protocol === 'https:', sameSite: 'strict' }); // 15 mins
                    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
                    originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
                    return api(originalRequest);
                }
            } catch {
                handleForceLogout();
                return Promise.reject(error);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
