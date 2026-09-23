import { supabase } from "@/integrations/supabase/client";

export const PRODUCT_IMAGE_BUCKET = "product-images";

/** Types Supabase storage will accept as-is. Anything else is converted to JPEG first. */
const DIRECT_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_BYTES = 10 * 1024 * 1024;
const MAX_DIMENSION = 2400;

function extensionFor(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  if (type === "image/avif") return "avif";
  return "jpg";
}

function randomName(type: string) {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${id}.${extensionFor(type)}`;
}

/** Re-encodes an image in the browser so heavy phone photos and odd formats still upload. */
async function toUploadableFile(file: File): Promise<File> {
  const needsConvert = !DIRECT_TYPES.includes(file.type) || file.size > MAX_BYTES;
  if (!needsConvert) return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error(
      `${file.name} isn't an image this browser can read. Please save it as a JPG or PNG and try again.`,
    );
  }

  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process the image in this browser.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((result) => resolve(result), "image/jpeg", 0.85),
  );
  if (!blob) throw new Error("Could not process the image in this browser.");
  if (blob.size > MAX_BYTES) {
    throw new Error(`${file.name} is too large even after compressing. Try a smaller photo.`);
  }
  return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.jpg`, { type: "image/jpeg" });
}

/** Uploads an image file from the admin's computer and returns the URL to store on the product. */
export async function uploadProductImage(file: File, folder = "products"): Promise<string> {
  if (!file.type.startsWith("image/") && !/\.(jpe?g|png|webp|avif|heic|heif)$/i.test(file.name)) {
    throw new Error(`${file.name}: please choose an image file.`);
  }

  const { data: session } = await supabase.auth.getSession();
  if (!session.session) {
    throw new Error("Your sign-in has expired. Please sign in again, then retry the upload.");
  }

  const prepared = await toUploadableFile(file);
  const path = `${folder}/${randomName(prepared.type)}`;

  const { error } = await supabase.storage.from(PRODUCT_IMAGE_BUCKET).upload(path, prepared, {
    cacheControl: "31536000",
    contentType: prepared.type,
    upsert: false,
  });

  if (error) {
    const raw = error.message || "";
    if (/row-level security|Unauthorized|403/i.test(raw)) {
      throw new Error("This account doesn't have permission to upload images.");
    }
    if (/exceeded|too large|413/i.test(raw)) {
      throw new Error(`${file.name} is larger than the 10 MB limit.`);
    }
    throw new Error(`Upload failed: ${raw || "please try again."}`);
  }

  return `/api/public/media/${path}`;
}

const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime", "video/ogg"];
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

function videoExtension(type: string, name: string) {
  if (type === "video/webm") return "webm";
  if (type === "video/ogg") return "ogv";
  if (type === "video/quicktime") return "mov";
  const fromName = name.match(/\.(mp4|webm|mov|m4v|ogv)$/i)?.[1];
  return (fromName ?? "mp4").toLowerCase();
}

function isVideoFile(file: File) {
  return file.type.startsWith("video/") || /\.(mp4|webm|mov|m4v|ogv)$/i.test(file.name);
}

/** Uploads an image OR a video from the admin's computer and returns its URL. */
export async function uploadMedia(file: File, folder = "content"): Promise<string> {
  if (!isVideoFile(file)) return uploadProductImage(file, folder);

  if (file.type && !VIDEO_TYPES.includes(file.type)) {
    throw new Error(`${file.name}: please use an MP4, WebM or MOV video.`);
  }
  if (file.size > MAX_VIDEO_BYTES) {
    throw new Error(`${file.name} is larger than the 50 MB video limit.`);
  }

  const { data: session } = await supabase.auth.getSession();
  if (!session.session) {
    throw new Error("Your sign-in has expired. Please sign in again, then retry the upload.");
  }

  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const path = `${folder}/${id}.${videoExtension(file.type, file.name)}`;

  const { error } = await supabase.storage.from(PRODUCT_IMAGE_BUCKET).upload(path, file, {
    cacheControl: "31536000",
    contentType: file.type || "video/mp4",
    upsert: false,
  });

  if (error) {
    const raw = error.message || "";
    if (/row-level security|Unauthorized|403/i.test(raw)) {
      throw new Error("This account doesn't have permission to upload videos.");
    }
    if (/exceeded|too large|413/i.test(raw)) {
      throw new Error(`${file.name} is larger than the 50 MB video limit.`);
    }
    throw new Error(`Upload failed: ${raw || "please try again."}`);
  }

  return `/api/public/media/${path}`;
}

