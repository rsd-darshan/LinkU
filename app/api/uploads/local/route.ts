import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { requireUser } from "@/lib/auth";
import { badRequest, handleApiError, ok } from "@/lib/http";

const MAX_SIZE_BYTES = 20 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime"
]);

export async function POST(req: Request) {
  try {
    const currentUser = await requireUser();
    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) return badRequest("file is required");
    if (!ALLOWED_MIME.has(file.type)) return badRequest("Unsupported file type");
    if (file.size > MAX_SIZE_BYTES) return badRequest("File too large (max 20MB)");

    const extension = path.extname(file.name).toLowerCase() || ".bin";
    const fileName = `${Date.now()}-${randomUUID()}${extension}`;
    const relativeDir = path.join("uploads", currentUser.id);
    const relativePath = path.join(relativeDir, fileName);
    const absoluteDir = path.join(process.cwd(), "public", relativeDir);
    const absolutePath = path.join(process.cwd(), "public", relativePath);

    await mkdir(absoluteDir, { recursive: true });
    const bytes = await file.arrayBuffer();
    await writeFile(absolutePath, Buffer.from(bytes));

    return ok({ url: `/${relativePath.replace(/\\/g, "/")}` }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
