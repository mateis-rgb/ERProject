// Client API avec auto-refresh du token sur 401 (Power of 10 R4)
import { ApiResult } from "../types";

let refreshing = false;

async function doRefresh(): Promise<boolean> {
    if (refreshing) return false;
    refreshing = true;
    try {
        const res = await fetch("/api/auth/refresh", {
            method: "POST",
            credentials: "include",
        });
        return res.ok;
    } catch {
        return false;
    } finally {
        refreshing = false;
    }
}

async function rawRequest(url: string, options?: RequestInit): Promise<Response> {
    return fetch(url, {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        ...options,
    });
}

async function request<T>(url: string, options?: RequestInit, retried = false): Promise<ApiResult<T>> {
    try {
        const res = await rawRequest(url, options);
        if (res.status === 401 && !retried && !url.includes("/auth/login") && !url.includes("/auth/refresh")) {
            const ok = await doRefresh();
            if (ok) return request<T>(url, options, true);
        }
        const data = (await res.json()) as ApiResult<T>;
        if (!res.ok) {
            return { success: false, error: data.success === false ? data.error : `HTTP ${res.status}` };
        }
        return data;
    } catch (err) {
        const msg = err instanceof Error ? err.message : "Erreur réseau";
        return { success: false, error: msg };
    }
}

export const api = {
    get: <T>(url: string) => request<T>(url),
    post: <T>(url: string, body: unknown) =>
        request<T>(url, { method: "POST", body: JSON.stringify(body) }),
    patch: <T>(url: string, body: unknown) =>
        request<T>(url, { method: "PATCH", body: JSON.stringify(body) }),
    put: <T>(url: string, body: unknown) =>
        request<T>(url, { method: "PUT", body: JSON.stringify(body) }),
    delete: <T>(url: string) => request<T>(url, { method: "DELETE" }),
};
