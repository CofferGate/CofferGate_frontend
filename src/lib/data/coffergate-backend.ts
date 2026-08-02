import "server-only";

import { GoogleAuth } from "google-auth-library";
import { z } from "zod";
import { ApiError } from "@/lib/domain";

const backendErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  retryable: z.boolean(),
  proposalId: z.string().optional(),
  requestId: z.string(),
});

function readBackendBaseUrl(): string {
  const value = process.env.COFFERGATE_BACKEND_URL?.replace(/\/$/, "");
  if (!value) {
    throw new Error("COFFERGATE_BACKEND_URL is required.");
  }
  return value;
}

const backendBaseUrl = readBackendBaseUrl();

const auth = new GoogleAuth();
let clientPromise: ReturnType<typeof auth.getIdTokenClient> | undefined;

function getClient() {
  clientPromise ??= auth.getIdTokenClient(backendBaseUrl);
  return clientPromise;
}

function fallbackError(status: number | undefined) {
  switch (status) {
    case 400:
      return { code: "BAD_REQUEST", message: "요청이 올바르지 않습니다.", retryable: false };
    case 401:
    case 403:
      return { code: "CLOUD_RUN_AUTH_FAILED", message: "Devnet 백엔드 인증 또는 호출 권한을 확인해 주세요.", retryable: false };
    case 404:
      return { code: "NOT_FOUND", message: "요청한 데이터를 찾을 수 없습니다.", retryable: false };
    case 409:
      return { code: "CONFLICT", message: "백엔드 상태가 변경되어 요청을 처리할 수 없습니다.", retryable: false };
    case 429:
      return { code: "RATE_LIMITED", message: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.", retryable: true };
    case 503:
      return { code: "SERVICE_UNAVAILABLE", message: "Devnet 백엔드를 일시적으로 사용할 수 없습니다.", retryable: true };
    default:
      return { code: "BACKEND_REQUEST_FAILED", message: "Devnet 백엔드 요청에 실패했습니다.", retryable: status === undefined || status >= 500 };
  }
}

export async function callBackend<ResponseData>(path: string): Promise<ResponseData> {
  try {
    const client = await getClient();
    const response = await client.request<ResponseData>({
      method: "GET",
      url: `${backendBaseUrl}${path}`,
    });
    return response.data;
  } catch (error: unknown) {
    const response =
      typeof error === "object" && error !== null && "response" in error
        ? (error.response as { status?: number; data?: unknown } | undefined)
        : undefined;
    const parsed = backendErrorSchema.safeParse(response?.data);
    if (parsed.success) throw new ApiError(parsed.data);

    const fallback = fallbackError(response?.status);
    throw new ApiError({
      ...fallback,
      requestId: "unavailable",
    });
  }
}
