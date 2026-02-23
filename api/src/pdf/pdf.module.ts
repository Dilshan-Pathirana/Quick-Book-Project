import { Module } from '@nestjs/common';
import { FilesModule } from '../files/files.module';
import { PdfService } from './pdf.service';

@Module({
  imports: [FilesModule],
  providers: [PdfService],
  exports: [PdfService],
})
export class PdfModule {}
