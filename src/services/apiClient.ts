const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5293/api/v1";

import Cookies from "js-cookie";

type Interceptor<T> = (value: T) => T | Promise<T>;
type ErrorInterceptor = (error: any) => void | Promise<void>;

export type CustomRequestInit = RequestInit & {
  skipAuth?: boolean;
  _retry?: boolean;
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
    const makeRequest = async (): Promise<T> => {
      try {
        let finalOptions: CustomRequestInit = {
          ...options,
        };

        for (const interceptor of this.interceptors.request) {
          finalOptions = await interceptor(finalOptions);
        }

        finalOptions.headers = {
          "Content-Type": "application/json",
          ...finalOptions.headers,
        };

        let response = await fetch(
          `${this.baseURL}${endpoint}`,
          finalOptions
        );

        for (const interceptor of this.interceptors.response) {
          response = await interceptor(response);
        }

        // HANDLE 401
        if (
          response.status === 401 &&
          !finalOptions._retry &&
          !endpoint.includes("/auth/refresh")
        ) {
          finalOptions._retry = true;

          try {
            const { useAuthStore } = await import(
              "@/store/authStore"
            );

            const refreshSuccess =
              await useAuthStore
                .getState()
                .refreshToken();

            if (refreshSuccess) {
              return this.request<T>(endpoint, finalOptions);
            }

            // If refresh failed, logout and redirect
            useAuthStore.getState().logout();

            if (typeof window !== "undefined") {
              window.location.href = "/signin";
            }

            throw new Error("Session expired");
          } catch (refreshError) {
            // Ensure logout on any refresh error
            const { useAuthStore } = await import(
              "@/store/authStore"
            );
            useAuthStore.getState().logout();

            if (typeof window !== "undefined") {
              window.location.href = "/signin";
            }

            throw new Error("Session expired");
          }
        }

        if (!response.ok) {
          let errorData: any;

          try {
            errorData = await response.json();
          } catch {
            errorData = {
              message: response.statusText,
            };
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
      }
    };

    return makeRequest();
  }
}

export const httpClient = new FetchClient(BASE_URL);

// REQUEST INTERCEPTOR
httpClient.addRequestInterceptor(async (options) => {
  if (typeof window !== "undefined") {
    if (!options.skipAuth) {
      const token = Cookies.get("token");

      if (token) {
        // Check if token is expired before making the request
        try {
          const { jwtDecode } = await import('jwt-decode');
          const decoded: any = jwtDecode(token);
          const currentTime = Date.now() / 1000;
          
          // If token is expired, try to refresh proactively
          if (decoded.exp < currentTime) {
            const { useAuthStore } = await import("@/store/authStore");
            const refreshSuccess = await useAuthStore.getState().refreshToken();
            
            if (refreshSuccess) {
              const newToken = Cookies.get("token");
              if (newToken) {
                options.headers = {
                  ...options.headers,
                  Authorization: `Bearer ${newToken}`,
                };
              }
            } else {
              // If refresh failed, let the 401 handler deal with it
              return options;
            }
          } else {
            options.headers = {
              ...options.headers,
              Authorization: `Bearer ${token}`,
            };
          }
        } catch (error) {
          // If token is invalid, let the 401 handler deal with it
          console.warn('Token validation failed:', error);
        }
      }
    }
  }

  options.credentials = "include";

  return options;
});

// RESPONSE INTERCEPTOR
httpClient.addResponseInterceptor((response) => {
  return response;
});

// ERROR INTERCEPTOR
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
  } else {
    console.error("💥 Unknown Error:", error.message);
  }
});

export const apiClient = async <T = any>(
  endpoint: string,
  options: CustomRequestInit = {}
): Promise<T> => {
  return httpClient.request<T>(endpoint, options);
};

export const api = {
  get: <T = any>(
    endpoint: string,
    options?: CustomRequestInit
  ) =>
    httpClient.request<T>(endpoint, {
      ...options,
      method: "GET",
    }),

  post: <T = any>(
    endpoint: string,
    body: any,
    options?: CustomRequestInit
  ) =>
    httpClient.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(body),
    }),

  put: <T = any>(
    endpoint: string,
    body: any,
    options?: CustomRequestInit
  ) =>
    httpClient.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(body),
    }),

  delete: <T = any>(
    endpoint: string,
    options?: CustomRequestInit
  ) =>
    httpClient.request<T>(endpoint, {
      ...options,
      method: "DELETE",
    }),
};