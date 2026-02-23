import { Controller, Get, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { FilesService } from './files.service';

@Controller('files')
export class FilesController {
  constructor(private readonly files: FilesService) {}

  @Get(':fileId')
  async get(@Param('fileId') fileId: string, @Res() res: Response) {
    const { file, stream } = await this.files.getFileStream(fileId);

    res.setHeader('Content-Type', file.mimeType);
    if (file.originalName) {
      res.setHeader(
        'Content-Disposition',
        `inline; filename="${encodeURIComponent(file.originalName)}"`,
      );
    }

    return stream.pipe(res);
  }
}
