import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('customers')
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}

  @Get()
  list(@Query('search') search?: string) {
    return this.customers.list(search);
  }

  @Get('autocomplete')
  autocomplete(@Query('q') q: string) {
    return this.customers.autocomplete(q);
  }

  @Post()
  create(@Body() dto: CreateCustomerDto) {
    return this.customers.create(dto);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.customers.get(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.customers.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.customers.remove(id);
  }

  @Get(':id/transactions')
  transactions(@Param('id') id: string) {
    return this.customers.transactions(id);
  }
}
