export type ApiResponse<T = void, E = void> = {
    readonly ok: true,
    readonly status: number,
    readonly data: T,
} | {
    readonly ok: false,
    readonly status?: number,
    readonly data?: E,
};

interface NonRequestBodyParams {
    query?: Record<string, string | number | boolean | null | undefined>;
    headers?: Record<string, string>;
    timeout?: number;
}

interface HasRequestBodyParams extends NonRequestBodyParams {
    body?: string | object | Blob | FormData;
}

type RequestMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type RequestMethodParams = {
    "GET": NonRequestBodyParams,
    "POST": HasRequestBodyParams,
    "PUT": HasRequestBodyParams,
    "PATCH": HasRequestBodyParams,
    "DELETE": NonRequestBodyParams,
}

type Accept = "" | "application/json" | "application/octet-stream";

type AcceptType = {
    "": void,
    "application/json": any,
    "application/octet-stream": Blob,
};

type AcceptDefault = {
    "": void,
    "application/json": unknown,
    "application/octet-stream": Blob,
};

const DEFAULT_TIMEOUT = 60000;

async function fetch<
    M extends RequestMethod,
    A extends Accept,
    T extends AcceptType[A] = AcceptDefault[A],
    E extends AcceptType[A] | void = void,
>(
    method: M,
    url: string,
    accept: Accept,
    params: RequestMethodParams[M] = {}
): Promise<ApiResponse<T, E>> {
    try {
        const controller = new AbortController();
        const id = window.setTimeout(() => controller.abort(), params.timeout || DEFAULT_TIMEOUT);

        const headers = params.headers || {};
        if (accept !== "") {
            headers.Accept = accept;
        }

        let body = undefined;
        if ("body" in params) {
            if (params.body instanceof FormData) {
                body = params.body;
            } else if (params.body instanceof Blob) {
                body = params.body;
                headers["Content-Type"] = "application/octet-stream";
            } else if (typeof params.body === "object") {
                body = JSON.stringify(params.body);
                headers["Content-Type"] = "application/json";
            } else if (params.body !== undefined) {
                body = params.body.toString();
                headers["Content-Type"] = "text/plain";
            }
        }

        const init: RequestInit = {
            method,
            credentials: "same-origin",
            cache: "no-store",
            headers,
            body,
            signal: controller.signal
        };

        if (params.query) {
            const query = new URLSearchParams();
            for (const [key, value] of Object.entries(params.query)) {
                if (value !== null && value !== undefined) {
                    query.append(key, value.toString());
                }
            }
            url += `?${query.toString()}`;
        }

        const response = await window.fetch(url, init);
        clearTimeout(id);

        let data = undefined;
        if (accept) {
            const ct = response.headers.get("Content-Type");
            if (ct) {
                if (ct.startsWith("application/json")) {
                    data = await response.json();
                } else if (ct.startsWith("application/octet-stream")) {
                    data = await response.blob();
                }
            }
        }

        return {ok: response.ok, status: response.status, data};
    } catch {
        return {ok: false};
    }
}

const createMethods = <A extends Accept>(
    baseUrl: string,
    accept: A
) => ({
    get: async <T extends AcceptType[A] = AcceptDefault[A], E extends AcceptType[A] | void = void>(
        url: string,
        params?: RequestMethodParams["GET"],
    ): Promise<ApiResponse<T, E>> => fetch("GET", baseUrl + url, accept, params),
    post: async <T extends AcceptType[A] = AcceptDefault[A], E extends AcceptType[A] | void = void>(
        url: string,
        params?: RequestMethodParams["POST"],
    ): Promise<ApiResponse<T, E>> => fetch("POST", baseUrl + url, accept, params),
    put: async <T extends AcceptType[A] = AcceptDefault[A], E extends AcceptType[A] | void = void>(
        url: string,
        params?: RequestMethodParams["PUT"],
    ): Promise<ApiResponse<T, E>> => fetch("PUT", baseUrl + url, accept, params),
    patch: async <T extends AcceptType[A] = AcceptDefault[A], E extends AcceptType[A] | void = void>(
        url: string,
        params?: RequestMethodParams["PATCH"],
    ): Promise<ApiResponse<T, E>> => fetch("PATCH", baseUrl + url, accept, params),
    delete: async <T extends AcceptType[A] = AcceptDefault[A], E extends AcceptType[A] | void = void>(
        url: string,
        params?: RequestMethodParams["DELETE"],
    ): Promise<ApiResponse<T, E>> => fetch("DELETE", baseUrl + url, accept, params),
});

export const createApi = (baseUrl: string = "") => ({
    ...createMethods(baseUrl, ""),
    json: createMethods(baseUrl, "application/json"),
    octetStream: createMethods(baseUrl, "application/octet-stream"),
});
