import { Injectable, BadRequestException } from "@nestjs/common";
import { diskStorage } from "multer";
import { v4 as uuidv4 } from "uuid";
import { extname, join } from "path";
import { existsSync, mkdirSync, unlinkSync } from "fs";

@Injectable()
export class FileService {
  private readonly uploadDir = join(process.cwd(), "uploads");
  private readonly avatarDir = join(this.uploadDir, "avatars");

  constructor() {
    this.ensureDirectoriesExist();
  }

  private ensureDirectoriesExist(): void {
    if (!existsSync(this.uploadDir)) {
      mkdirSync(this.uploadDir, { recursive: true });
    }
    if (!existsSync(this.avatarDir)) {
      mkdirSync(this.avatarDir, { recursive: true });
    }
  }

  getAvatarStorageConfig() {
    return {
      storage: diskStorage({
        destination: (req, file, cb) => {
          cb(null, this.avatarDir);
        },
        filename: (req, file, cb) => {
          const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
          cb(null, uniqueName);
        },
      }),
      fileFilter: (
        req: any,
        file: Express.Multer.File,
        cb: (error: Error | null, acceptFile: boolean) => void,
      ) => {
        const allowedMimeTypes = [
          "image/jpeg",
          "image/png",
          "image/gif",
          "image/webp",
        ];
        if (allowedMimeTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              "只允许上传图片文件 (jpeg, png, gif, webp)",
            ),
            false,
          );
        }
      },
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    };
  }

  getAvatarUrl(filename: string): string {
    return `/uploads/avatars/${filename}`;
  }

  deleteAvatar(filename: string): void {
    const filePath = join(this.avatarDir, filename);
    if (existsSync(filePath)) {
      unlinkSync(filePath);
    }
  }

  extractFilenameFromUrl(url: string): string | null {
    if (!url) return null;
    const match = url.match(/\/uploads\/avatars\/(.+)$/);
    return match ? match[1] : null;
  }
}
