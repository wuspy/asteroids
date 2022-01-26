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

export const fetch = async <T>(url: string, config: RequestInit): Promise<ApiResponse<T>> => {
    try {
        const response = await window.fetch(url, {
            credentials: "same-origin",
            headers: {
                "Content-type": "application/json",
                "accept": "application/json",
            },
            ...config
        });
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

export const get = async <T>(url: string): Promise<ApiResponse<T>> =>
    fetch(url, { method: "GET" });

export const post = async <T>(url: string, body: object = {}): Promise<ApiResponse<T>> =>
    fetch(url, { method: "POST", body: JSON.stringify(body) });
