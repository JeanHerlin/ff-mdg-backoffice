const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

export interface ApiFieldError {
  field: string;
  message: string;
}

export class ApiError extends Error {
  statusCode: number;
  errors?: ApiFieldError[];

  constructor(statusCode: number, message: string, errors?: ApiFieldError[]) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

interface Envelope<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  errors?: ApiFieldError[];
  meta?: { page: number; perPage: number; total: number; totalPages: number };
}

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  skipAuthRetry?: boolean;
}

async function rawRequest<T>(path: string, options: RequestOptions = {}): Promise<Envelope<T>> {
  const isFormData = options.body instanceof FormData;

  const headers = new Headers(options.headers);
  if (!isFormData && options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
    body: isFormData ? (options.body as FormData) : options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const json = (await res.json().catch(() => null)) as Envelope<T> | null;

  if (!json) {
    throw new ApiError(res.status, "server.internal_error");
  }

  return json;
}

interface ApiResult<T> {
  data: T | undefined;
  meta?: Envelope<T>["meta"];
}

export async function apiRequestWithMeta<T>(path: string, options: RequestOptions = {}): Promise<ApiResult<T>> {
  let envelope = await rawRequest<T>(path, options);

  if (!envelope.success && envelope.statusCode === 401 && !options.skipAuthRetry && path !== "/auth/refresh") {
    const refreshed = await tryRefresh();
    if (refreshed) {
      envelope = await rawRequest<T>(path, options);
    }
  }

  if (!envelope.success) {
    throw new ApiError(envelope.statusCode, envelope.message, envelope.errors);
  }

  return { data: envelope.data, meta: envelope.meta };
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T | undefined> {
  const { data } = await apiRequestWithMeta<T>(path, options);
  return data;
}

export async function tryRefresh(): Promise<boolean> {
  try {
    const envelope = await rawRequest<{ accessToken: string }>("/auth/refresh", {
      method: "POST",
      skipAuthRetry: true,
    });
    if (envelope.success && envelope.data) {
      setAccessToken(envelope.data.accessToken);
      return true;
    }
  } catch {
    // pas de session valide
  }
  setAccessToken(null);
  return false;
}
