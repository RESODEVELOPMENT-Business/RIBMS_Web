const INVOICE_BASE_URL =
  process.env.NEXT_PUBLIC_INVOICE_API_URL || "http://localhost:5127/api/v1";

// Simple invoice API client (no auth needed for now, or uses same token)
export const invoiceApiClient = async <T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const isFormData = options.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers as Record<string, string> || {}),
  };

  const response = await fetch(`${INVOICE_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorData: any;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText };
    }
    const error: any = new Error(
      errorData.message || errorData.title || `API call failed: ${response.status}`
    );
    error.status = response.status;
    error.data = errorData;
    throw error;
  }

  const isJson = response.headers.get("content-type")?.includes("application/json");
  if (!isJson || response.status === 204 || response.headers.get("content-length") === "0") {
    return {} as T;
  }

  return await response.json();
};

export const invoiceApi = {
  get: <T = any>(endpoint: string, options?: RequestInit) =>
    invoiceApiClient<T>(endpoint, { ...options, method: "GET" }),

  put: <T = any>(endpoint: string, body: any, options?: RequestInit) =>
    invoiceApiClient<T>(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(body),
    }),

  post: <T = any>(endpoint: string, body?: any, options?: RequestInit) =>
    invoiceApiClient<T>(endpoint, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),
};
