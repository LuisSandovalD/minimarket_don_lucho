import { z } from "zod";
const schema = z.object({
  DATABASE_URL: z.string().min(1), APP_URL: z.url(), AUTH_SECRET: z.string().min(32),
  BREVO_API_KEY: z.string().optional(), BREVO_SENDER_EMAIL: z.string().optional(), BREVO_SENDER_NAME: z.string().default("Minimarket Don Lucho"),
  CLOUDINARY_CLOUD_NAME: z.string().optional(), CLOUDINARY_API_KEY: z.string().optional(), CLOUDINARY_API_SECRET: z.string().optional(),
  MAX_UPLOAD_MB: z.coerce.number().positive().max(20).default(5)
});
export const env = () => schema.parse(process.env);
