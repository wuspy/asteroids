import { Resource } from "solid-js";
import { ApiErrorType, ApiResponse } from "./request";

export function ok<T>(resource: Resource<ApiResponse<T>>): T | undefined {
    const value = resource();
    return value?.ok ? value.data : undefined;
}

export function some<T>(resource: Resource<ApiResponse<T>>): T | undefined {
    const value = resource();
    return value?.ok && !!value.data ? value.data : undefined;
}

export function empty<T>(resource: Resource<ApiResponse<T>>): boolean {
    const value = resource();
    return value?.ok ? !value.data : false;
}

export function error<T>(resource: Resource<ApiResponse<T>>): string | undefined {
    const value = resource();
    return value && !value.ok
        ? value.error === ApiErrorType.ApiError
            ? value.message
            : "Error contacting server. Try again later."
        : undefined;
}
