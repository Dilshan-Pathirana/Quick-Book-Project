import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { AccountingService } from './accounting.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { AccountType } from '@prisma/client';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accounting: AccountingService) {}

  @Roles('OWNER', 'ACCOUNTANT')
  @Get()
  list() {
    return this.accounting.listAccounts();
  }

  @Roles('OWNER', 'ACCOUNTANT')
  @Post()
  create(@Body() dto: CreateAccountDto) {
    return this.accounting.createAccount({
      accountCode: dto.accountCode,
      accountName: dto.accountName,
      accountType: dto.accountType as AccountType,
      parentAccountId: dto.parentAccountId,
    });
  }
}
