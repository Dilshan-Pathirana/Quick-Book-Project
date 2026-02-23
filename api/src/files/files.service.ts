import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createReadStream, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  getStorageRoot() {
    const dir = this.config.get<string>('FILE_STORAGE_DIR') ?? 'storage';
    return resolve(process.cwd(), dir);
  }

  ensureDir(filePath: string) {
    const dir = dirname(filePath);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  }

  async createFileRecord(params: {
    storagePath: string;
    mimeType: string;
    originalName?: string;
    version?: number;
  }) {
    return this.prisma.fileObject.create({
      data: {
        storagePath: params.storagePath,
        mimeType: params.mimeType,
        originalName: params.originalName,
        version: params.version ?? 1,
      },
    });
  }

  async getFileStream(fileId: string) {
    const file = await this.prisma.fileObject.findUnique({ where: { id: fileId } });
    if (!file) throw new NotFoundException('File not found');

    const absPath = join(this.getStorageRoot(), file.storagePath);
    if (!existsSync(absPath)) throw new NotFoundException('File missing on disk');

    return {
      file,
      stream: createReadStream(absPath),
    };
  }
}
