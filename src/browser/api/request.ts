export const enum ApiErrorType {
    ApiError,
    HttpError,
    RequestError,
}

export type ApiResponse<T> = {
    ok: true,
    data: T,
} | {
    ok: false,
    error: ApiErrorType.ApiError,
    message: string,
} | {
    ok: false,
    error: ApiErrorType.HttpError,
    status: number,
} | {
    ok: false,
    error: ApiErrorType.RequestError,
    reason: any,
};

export const fetch = async <T>(url: string, init: RequestInit & { timeout?: number }): Promise<ApiResponse<T>> => {
    try {
        const controller = new AbortController();
        const id = window.setTimeout(() => controller.abort(), init.timeout || 60000);
        const response = await window.fetch(url, {
            credentials: "same-origin",
            headers: {
                "Content-type": "application/json",
                "accept": "application/json",
            },
            ...init,
            signal: controller.signal
        });
        clearTimeout(id);

        if (response.ok) {
            const json = await response.json();
            if (typeof json === "object" && typeof json.ok === "boolean") {
                if (json.ok) {
                    return {
                        ok: true,
                        data: json.data as T,
                    };
                } else {
                    return {
                        ok: false,
                        error: ApiErrorType.ApiError,
                        message: typeof json.message === "string" ? json.message : "",
                    };
                }
            } else {
                return {
                    ok: false,
                    error: ApiErrorType.ApiError,
                    message: "The server sent an invalid response.",
                };
            }
        } else {
            return {
                ok: false,
                error: ApiErrorType.HttpError,
                status: response.status,
            };
        }
    } catch (e) {
        return {
            ok: false,
            error: ApiErrorType.RequestError,
            reason: e,
        };
    }
}

export const get = async <T>(url: string, timeout?: number): Promise<ApiResponse<T>> =>
    fetch(url, { method: "GET", timeout });

export const post = async <T>(url: string, body: object = {}, timeout?: number): Promise<ApiResponse<T>> =>
    fetch(url, { method: "POST", body: JSON.stringify(body), timeout });
