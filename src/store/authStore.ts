import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import { loginAPI, refreshTokenAPI } from '@/services/auth';

export type UserRole = 'Administrator' | 'BrandManager' | 'StoreManager';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  brandId?: number | null;
  adminStoreId?: number | null;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  setHydrated: () => void;
  login: (user: User) => void;
  authenticate: (email: string, password: string) => Promise<UserRole>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  isTokenExpired: () => boolean;
  checkAndRefreshToken: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isHydrated: false,
      setHydrated: () => set({ isHydrated: true }),
      login: (user) => set({ user, isAuthenticated: true }),
      authenticate: async (email, password) => {
        const data = await loginAPI({ email, password });

        const token = data?.data?.token || data?.token;
        const refreshToken = data?.data?.refreshToken || data?.refreshToken;

        if (!token) {
          throw new Error("Invalid credentials");
        }

        // Store tokens - expiration is controlled by backend JWT claims
        Cookies.set("token", token);
        if (refreshToken) {
          Cookies.set("refreshToken", refreshToken, { expires: 7 }); // Refresh token cookie storage
        }

        const decoded: any = jwtDecode(token);

        const role = decoded[
          "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
        ] as UserRole;


        set({
          user: {
            id: decoded.sub,
            email: decoded.email,
            fullName: decoded.name,
            role,
            brandId: decoded.BrandId
              ? Number(decoded.BrandId)
              : null,
            adminStoreId: decoded.AdminStoreId
              ? Number(decoded.AdminStoreId)
              : null,
          },
          isAuthenticated: true,
        });



        return role;
      },
      logout: () => {
        Cookies.remove("token");
        Cookies.remove("refreshToken");
        set({ user: null, isAuthenticated: false });
      },
      refreshToken: async () => {
        try {
          const data = await refreshTokenAPI();
          const token = data?.data?.token || data?.token;
          const newRefreshToken = data?.data?.refreshToken || data?.refreshToken;
          
          if (!token) {
            return false;
          }

          // Store tokens - expiration is controlled by backend JWT claims
          Cookies.set("token", token);
          // Update refresh token if provided
          if (newRefreshToken) {
            Cookies.set("refreshToken", newRefreshToken, { expires: 7 }); // Refresh token cookie storage
          }

          const decoded: any = jwtDecode(token);
          const role = decoded[
            "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
          ] as UserRole;

          set({
            user: {
              id: decoded.sub,
              email: decoded.email,
              fullName: decoded.name,
              role,
              brandId: decoded.BrandId
                ? Number(decoded.BrandId)
                : null,
              adminStoreId: decoded.AdminStoreId
                ? Number(decoded.AdminStoreId)
                : null,
            },
            isAuthenticated: true,
          });

          return true;
        } catch (error) {
          console.error('Token refresh failed:', error);
          return false;
        }
      },
      isTokenExpired: () => {
        const token = Cookies.get("token");
        if (!token) return true;

        try {
          const decoded: any = jwtDecode(token);
          const currentTime = Date.now() / 1000;
          return decoded.exp < currentTime;
        } catch {
          return true;
        }
      },
      checkAndRefreshToken: async () => {
        const token = Cookies.get("token");
        const refreshToken = Cookies.get("refreshToken");
        
        if (!token || !refreshToken) return false;

        try {
          const decoded: any = jwtDecode(token);
          const currentTime = Date.now() / 1000;
          const timeUntilExpiry = decoded.exp - currentTime;
          
          // Refresh token if it expires within the next 5 minutes (300 seconds)
          if (timeUntilExpiry < 300) {
            console.log("🔄 Token expiring soon, refreshing proactively");
            return await get().refreshToken();
          }
          
          return true;
        } catch {
          return false;
        }
      },
    }),
    {
      name: 'auth-storage', // name of the item in the storage (must be unique)
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);
