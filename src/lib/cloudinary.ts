import { createHash } from "node:crypto";
import { env } from "@/lib/env";
import { AppError } from "@/lib/errors";
export async function uploadImage(file: File, folder: "products" | "categories" | "users" | "business") {
  const config = env();
  if (!config.CLOUDINARY_CLOUD_NAME || !config.CLOUDINARY_API_KEY || !config.CLOUDINARY_API_SECRET) throw new AppError("CLOUDINARY_NOT_CONFIGURED", "Cloudinary no está configurado.", 503);
  if (!['image/jpeg','image/png','image/webp'].includes(file.type)) throw new AppError("INVALID_IMAGE", "Formato de imagen no permitido.");
  if (file.size > config.MAX_UPLOAD_MB * 1024 * 1024) throw new AppError("IMAGE_TOO_LARGE", `La imagen supera ${config.MAX_UPLOAD_MB} MB.`);
<<<<<<< HEAD
  const bytes = Buffer.from(await file.slice(0,16).arrayBuffer());
  const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  const png = bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  const webp = bytes.subarray(0,4).toString() === "RIFF" && bytes.subarray(8,12).toString() === "WEBP";
  if (!((file.type === "image/jpeg" && jpeg) || (file.type === "image/png" && png) || (file.type === "image/webp" && webp))) throw new AppError("INVALID_IMAGE", "El contenido no corresponde a una imagen permitida.");
=======
>>>>>>> 3008127dd0bdc883b181438f1db61d13f3f5c6a9
  const timestamp = Math.floor(Date.now() / 1000); const target = `minimarket-don-lucho/${folder}`;
  const signature = createHash("sha1").update(`folder=${target}&timestamp=${timestamp}${config.CLOUDINARY_API_SECRET}`).digest("hex");
  const body = new FormData(); body.set("file", file); body.set("folder", target); body.set("timestamp", String(timestamp)); body.set("api_key", config.CLOUDINARY_API_KEY); body.set("signature", signature);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${config.CLOUDINARY_CLOUD_NAME}/image/upload`, { method: "POST", body });
  if (!response.ok) throw new AppError("UPLOAD_FAILED", "No se pudo subir la imagen.", 502);
  const result = await response.json() as { secure_url: string; public_id: string };
  return { imageUrl: result.secure_url, imagePublicId: result.public_id };
}
export async function deleteImage(publicId: string) {
<<<<<<< HEAD
  const config = env(); if (!config.CLOUDINARY_CLOUD_NAME || !config.CLOUDINARY_API_KEY || !config.CLOUDINARY_API_SECRET) throw new AppError("CLOUDINARY_NOT_CONFIGURED", "Cloudinary no está configurado.", 503);
  const timestamp = Math.floor(Date.now() / 1000); const signature = createHash("sha1").update(`public_id=${publicId}&timestamp=${timestamp}${config.CLOUDINARY_API_SECRET}`).digest("hex");
  const response = await fetch(`https://api.cloudinary.com/v1_1/${config.CLOUDINARY_CLOUD_NAME}/image/destroy`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ public_id: publicId, timestamp: String(timestamp), api_key: config.CLOUDINARY_API_KEY, signature }) });
  if (!response.ok) throw new AppError("DELETE_IMAGE_FAILED", "No se pudo eliminar la imagen anterior.", 502);
=======
  const config = env(); if (!config.CLOUDINARY_CLOUD_NAME || !config.CLOUDINARY_API_KEY || !config.CLOUDINARY_API_SECRET) return;
  const timestamp = Math.floor(Date.now() / 1000); const signature = createHash("sha1").update(`public_id=${publicId}&timestamp=${timestamp}${config.CLOUDINARY_API_SECRET}`).digest("hex");
  await fetch(`https://api.cloudinary.com/v1_1/${config.CLOUDINARY_CLOUD_NAME}/image/destroy`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ public_id: publicId, timestamp: String(timestamp), api_key: config.CLOUDINARY_API_KEY, signature }) });
>>>>>>> 3008127dd0bdc883b181438f1db61d13f3f5c6a9
}
