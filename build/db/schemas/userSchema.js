import { z } from "zod";
export const UserSchema = z.object({
    client_id: z.string(),
    access_token: z.string(),
    refresh_token: z.string(),
    expires_at: z.string().transform((val) => new Date(val)),
    updated_at: z.string().transform((val) => new Date(val))
});
