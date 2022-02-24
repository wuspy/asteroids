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

export const mapApiResponse = async <T, R>(response: Promise<ApiResponse<T>>, fn: (data: T) => R | Promise<R>): Promise<ApiResponse<R>> =>
    response.then(async (response) =>
        response.ok ? {
            ok: true,
            data: await fn(response.data),
        } : response
    );

type ContentType = "text/plain" | "application/json" | "application/octet-stream" | "multipart/form-data";
type BodyType = string | object | Blob | FormData;
type FetchResponse = {
    "text/plain": ApiResponse<string>;
    "application/json": ApiResponse<any>;
    "application/octet-stream": ApiResponse<Blob>;
    "multipart/form-data": ApiResponse<FormData>;
};

export const fetch = async <CT extends ContentType>(params: {
    url: string,
    method: string,
    accept: CT,
    body?: BodyType,
    timeout?: number,
}): Promise<FetchResponse[CT]> => {
    try {
        const controller = new AbortController();
        const id = window.setTimeout(() => controller.abort(), params.timeout || 60000);
        const init: RequestInit = {
            method: params.method,
            credentials: "same-origin",
            headers: {
                "accept": params.accept,
            },
            signal: controller.signal
        };
        if (params.body instanceof FormData) {
            init.body = params.body;
        } else if (params.body instanceof Blob) {
            init.body = params.body;
            (init.headers as any)["Content-Type"] = "application/octet-stream";
        } else if (typeof params.body === "object") {
            init.body = JSON.stringify(params.body);
            (init.headers as any)["Content-Type"] = "application/json";
        } else if (params.body !== undefined) {
            init.body = params.body.toString();
            (init.headers as any)["Content-Type"] = "text/plain";
        }

        const response = await window.fetch(params.url, init);
        clearTimeout(id);

        if (response.ok) {
            if (params.accept === "text/plain") {
                return {
                    ok: true,
                    data: await response.text(),
                };
            } else if (params.accept === "application/json") {
                const json = await response.json();
                if (typeof json === "object" && typeof json.ok === "boolean") {
                    if (json.ok) {
                        return {
                            ok: true,
                            data: json.data,
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
            } else if (params.accept === "application/octet-stream") {
                return {
                    ok: true,
                    data: await response.blob(),
                };
            } else if (params.accept === "multipart/form-data") {
                return {
                    ok: true,
                    data: await response.formData(),
                };
            } else {
                throw new Error("Invalid content type");
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

export const get = async <CT extends ContentType>(params: {
    url: string,
    accept: CT,
    timeout?: number,
}): Promise<FetchResponse[CT]> => fetch({ ...params, method: "GET" });

export const post = async <CT extends ContentType>(params: {
    url: string,
    accept: CT,
    body?: BodyType,
    timeout?: number,
}): Promise<FetchResponse[CT]> => fetch({ ...params, method: "POST" });
