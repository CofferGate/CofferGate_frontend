import { z } from "zod";

/** SPEC 18.1 common response envelope; "mock" per SPEC 26 */
export const apiEnvironmentSchema = z.enum(["mock", "devnet", "mainnet-beta"]);
export type ApiEnvironment = z.infer<typeof apiEnvironmentSchema>;

export const apiMetaSchema = z.object({
  requestId: z.string(),
  generatedAt: z.string(),
  environment: apiEnvironmentSchema,
});
export type ApiMeta = z.infer<typeof apiMetaSchema>;

export function apiResponseSchema<DataSchema extends z.ZodTypeAny>(
  dataSchema: DataSchema,
) {
  return z.object({
    data: dataSchema,
    meta: apiMetaSchema,
  });
}
export type ApiResponse<Data> = { data: Data; meta: ApiMeta };
