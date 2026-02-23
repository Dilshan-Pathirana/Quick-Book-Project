import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UsersService } from './users.service';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly users: UsersService) {}

  @Roles('OWNER')
  @Get()
  roles() {
    return this.users.roles();
  }
}
