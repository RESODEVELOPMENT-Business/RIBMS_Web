const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5293/api/v1";

import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import { useLoadingStore } from "@/store/loadingStore";

type Interceptor<T> = (value: T) => T | Promise<T>;
type ErrorInterceptor = (error: any) => void | Promise<void>;

export type CustomRequestInit = RequestInit & {
  skipAuth?: boolean;
  skipLoading?: boolean;
  _retry?: boolean;
};

// ----------------------------------------------------------------------------
// Singleton refresh-token promise
// Ensures concurrent requests share ONE refresh call instead of triggering
// multiple refresh API hits (which would invalidate each other).
// ----------------------------------------------------------------------------
let refreshPromise: Promise<boolean> | null = null;

const runRefresh = (): Promise<boolean> => {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const { useAuthStore } = await import("@/store/authStore");
      return await useAuthStore.getState().refreshToken();
    } catch {
      return false;
    } finally {
      // Keep the promise cached for 2s so concurrent 401s that arrive
      // slightly later still share the same result instead of spawning
      // another refresh call (which would invalidate the first one).
      setTimeout(() => {
        refreshPromise = null;
      }, 2000);
    }
  })();

  return refreshPromise;
};

// Guard to ensure handleSessionExpired only runs once across all concurrent
// requests. Reset when the page reloads (after redirect to /signin).
let sessionExpiredHandled = false;

const handleSessionExpired = async () => {
  if (sessionExpiredHandled) return;
  sessionExpiredHandled = true;

  const { useAuthStore } = await import("@/store/authStore");
  useAuthStore.getState().logout();

  if (typeof window !== "undefined") {
    // Avoid redirect loop if already on /signin
    if (!window.location.pathname.startsWith("/signin")) {
      window.location.href = "/signin";
    }
  }
};

class FetchClient {
  private baseURL: string;

  public interceptors = {
    request: [] as Interceptor<CustomRequestInit>[],
    response: [] as Interceptor<Response>[],
    error: [] as ErrorInterceptor[],
  };

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  public addRequestInterceptor(
    interceptor: Interceptor<CustomRequestInit>
  ) {
    this.interceptors.request.push(interceptor);
  }

  public addResponseInterceptor(
    interceptor: Interceptor<Response>
  ) {
    this.interceptors.response.push(interceptor);
  }

  public addErrorInterceptor(interceptor: ErrorInterceptor) {
    this.interceptors.error.push(interceptor);
  }

  public async request<T = any>(
    endpoint: string,
    options: CustomRequestInit = {}
  ): Promise<T> {
    const isBrowser = typeof window !== "undefined";
    const shouldTrackLoading = isBrowser && !options.skipLoading;

    if (shouldTrackLoading) {
      useLoadingStore.getState().startLoading();
    }

    try {
      let finalOptions: CustomRequestInit = { ...options };

      for (const interceptor of this.interceptors.request) {
        finalOptions = await interceptor(finalOptions);
      }

      const isFormData = finalOptions.body instanceof FormData;

      finalOptions.headers = {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...finalOptions.headers,
      };

      let response = await fetch(
        `${this.baseURL}${endpoint}`,
        finalOptions
      );

      for (const interceptor of this.interceptors.response) {
        response = await interceptor(response);
      }

      // ----------------------------------------------------------------------
      // 401 handling: refresh token then retry the original request once
      // This is a FALLBACK for cases where the token was valid when the
      // interceptor ran but got invalidated server-side mid-flight.
      // The primary refresh logic lives in the request interceptor below.
      // ----------------------------------------------------------------------
      if (
        response.status === 401 &&
        !finalOptions._retry &&
        !finalOptions.skipAuth &&
        !endpoint.includes("/auth/refresh") &&
        !endpoint.includes("/auth/login")
      ) {
        const refreshed = await runRefresh();

        if (refreshed) {
          // Retry once with fresh token. Strip old Authorization so the
          // request interceptor injects the new one.
          const retryOptions: CustomRequestInit = {
            ...options,
            _retry: true,
          };

          if (retryOptions.headers) {
            const headers = { ...(retryOptions.headers as Record<string, string>) };
            delete headers.Authorization;
            delete headers.authorization;
            retryOptions.headers = headers;
          }

          return this.request<T>(endpoint, retryOptions);
        }

        // Refresh failed -> session expired
        await handleSessionExpired();
        const err: any = new Error("Session expired");
        err.status = 401;
        throw err;
      }

      if (!response.ok) {
        let errorData: any;

        try {
          errorData = await response.json();
        } catch {
          errorData = { message: response.statusText };
        }

        const error: any = new Error(
          errorData.message ||
            errorData.title ||
            `API call failed: ${response.status}`
        );

        error.status = response.status;
        error.data = errorData;
        error.endpoint = endpoint;
        error.options = options;

        throw error;
      }

      const isJson = response.headers
        .get("content-type")
        ?.includes("application/json");

      if (
        !isJson ||
        response.status === 204 ||
        response.headers.get("content-length") === "0"
      ) {
        return {} as T;
      }

      return await response.json();
    } catch (error: any) {
      for (const interceptor of this.interceptors.error) {
        await interceptor(error);
      }
      throw error;
    } finally {
      if (shouldTrackLoading) {
        useLoadingStore.getState().stopLoading();
      }
    }
  }
}

export const httpClient = new FetchClient(BASE_URL);

// ----------------------------------------------------------------------------
// REQUEST INTERCEPTOR
// Attach access token. If it's already expired, refresh BEFORE sending the
// request (saves a roundtrip). Uses the same singleton refresh promise as
// the 401 handler, so concurrent requests share one refresh call.
//
// CRITICAL: if the proactive refresh fails here, we throw immediately.
// There is no point sending a request we know will get 401.
// ----------------------------------------------------------------------------
httpClient.addRequestInterceptor(async (options) => {
  if (typeof window !== "undefined" && !options.skipAuth) {
    let token = Cookies.get("token");

    if (token) {
      let expired = false;
      try {
        const decoded: any = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        // Treat tokens expiring within 10s as expired to avoid edge cases
        expired = !decoded.exp || decoded.exp < currentTime + 10;
      } catch {
        expired = true;
      }

      if (expired) {
        const refreshTokenValue = Cookies.get("refreshToken");
        if (refreshTokenValue) {
          const refreshed = await runRefresh();
          if (refreshed) {
            // Re-read token from cookies after successful refresh
            token = Cookies.get("token");
          } else {
            // Refresh failed → session is dead. Throw immediately so
            // we don't send a request that will just 401 again.
            await handleSessionExpired();
            const err: any = new Error("Session expired");
            err.status = 401;
            throw err;
          }
        } else {
          // No refresh token available → session expired
          await handleSessionExpired();
          const err: any = new Error("Session expired");
          err.status = 401;
          throw err;
        }
      }

      if (token) {
        options.headers = {
          ...options.headers,
          Authorization: `Bearer ${token}`,
        };
      }
    }
  }

  options.credentials = "include";
  return options;
});

// RESPONSE INTERCEPTOR
httpClient.addResponseInterceptor((response) => response);

// ERROR INTERCEPTOR (logging only)
httpClient.addErrorInterceptor(async (error: any) => {
  const status = error.status;

  if (status === 401) {
    console.warn("🔒 Unauthorized");
  } else if (status === 403) {
    console.error("🚫 Forbidden");
  } else if (status === 404) {
    console.warn("🔍 Not Found");
  } else if (status >= 500) {
    console.error("🔥 Server Error");
  } else if (status === 400) {
    console.warn("⚠️ Validation Error");
  } else if (status) {
    console.error("💥 Error:", error.message);
  }
});

export const apiClient = async <T = any>(
  endpoint: string,
  options: CustomRequestInit = {}
): Promise<T> => {
  return httpClient.request<T>(endpoint, options);
};

export const api = {
  get: <T = any>(endpoint: string, options?: CustomRequestInit) =>
    httpClient.request<T>(endpoint, { ...options, method: "GET" }),

  post: <T = any>(endpoint: string, body: any, options?: CustomRequestInit) =>
    httpClient.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(body),
    }),

  put: <T = any>(endpoint: string, body: any, options?: CustomRequestInit) =>
    httpClient.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(body),
    }),

  delete: <T = any>(endpoint: string, options?: CustomRequestInit) =>
    httpClient.request<T>(endpoint, { ...options, method: "DELETE" }),
};
