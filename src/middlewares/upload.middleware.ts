import crypto from "crypto";
import fs from "fs";
import path from "path";
import multer from "multer";

const uploadsRoot = path.join(__dirname, "../../uploads");

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdirSync(uploadsRoot, { recursive: true });
    cb(null, uploadsRoot);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().slice(0, 8);
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 32);
    const id = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
    cb(null, `${id}-${safe}${ext || ".jpg"}`);
  },
});

export const visitImageUpload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image uploads are allowed"));
    }
    cb(null, true);
  },
});

/** Convert absolute disk path under uploads/ to public URL — flat /uploads/{filename} */
export const toPublicUploadPath = (absolutePath: string): string => {
  const normalized = absolutePath.replace(/\\/g, "/");
  const marker = "/uploads/";
  const idx = normalized.lastIndexOf(marker);
  if (idx >= 0) return normalized.slice(idx);
  return `/uploads/${path.basename(absolutePath)}`;
};

export { uploadsRoot };
