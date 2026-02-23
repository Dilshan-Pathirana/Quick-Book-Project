import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { AccountingService } from './accounting.service';
import { CreateJournalEntryDto } from './dto/create-journal-entry.dto';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('journal-entries')
export class JournalEntriesController {
  constructor(private readonly accounting: AccountingService) {}

  @Roles('OWNER', 'ACCOUNTANT')
  @Get()
  list() {
    return this.accounting.listJournalEntries();
  }

  @Roles('OWNER', 'ACCOUNTANT')
  @Get(':id')
  async get(@Param('id') id: string) {
    const entry = await this.accounting.getJournalEntry(id);
    if (!entry) throw new NotFoundException('Journal entry not found');
    return entry;
  }

  @Roles('OWNER', 'ACCOUNTANT')
  @Post()
  create(
    @Body() dto: CreateJournalEntryDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.accounting.createManualEntry({
      referenceId: dto.referenceId,
      entryDate: new Date(dto.entryDate),
      description: dto.description,
      createdById: user.id,
      lines: dto.lines,
    });
  }
}
