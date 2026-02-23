import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Roles('OWNER')
  @Get()
  list() {
    return this.users.list();
  }

  @Roles('OWNER')
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.users.create(dto);
  }

  @Roles('OWNER')
  @Get(':id')
  get(@Param('id') id: string) {
    return this.users.get(id);
  }

  @Roles('OWNER')
  @Get(':id/history')
  history(@Param('id') id: string) {
    return this.users.history(id);
  }

  @Roles('OWNER')
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.users.update(id, dto);
  }

  @Roles('OWNER')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.users.remove(id);
  }
}
