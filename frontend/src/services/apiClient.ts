import axios, { AxiosError } from 'axios'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:5050/api/v1'

export const axiosInstance = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

export function setAuthToken(token: string | null): void {
  if (token) {
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`
  } else {
    delete axiosInstance.defaults.headers.common['Authorization']
  }
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

function normalizeError(err: unknown): never {
  if (err instanceof AxiosError && err.response) {
    const message =
      (err.response.data as { message?: string })?.message ?? 'Request failed'
    throw new ApiError(err.response.status, message)
  }
  throw err
}

export const apiClient = {
  get: <T>(path: string) =>
    axiosInstance.get<T>(path).then((r) => r.data).catch(normalizeError),

  post: <T>(path: string, body: unknown) =>
    axiosInstance.post<T>(path, body).then((r) => r.data).catch(normalizeError),

  patch: <T>(path: string, body: unknown) =>
    axiosInstance.patch<T>(path, body).then((r) => r.data).catch(normalizeError),

  delete: <T>(path: string) =>
    axiosInstance.delete<T>(path).then((r) => r.data).catch(normalizeError),
}
