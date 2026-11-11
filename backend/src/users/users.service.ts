
import {
  ConflictException,
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { hash } from 'bcryptjs';
import { Repository } from 'typeorm';

import { User } from './entities/user.entity.js';
import { Branch } from '../branches/entities/branch.entity.js';

import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UserRole } from './enums/user-role.enum.js';

import type { JwtPayload } from '../auth/strategies/jwt.strategy.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,

    @InjectRepository(Branch)
    private readonly branchesRepository: Repository<Branch>,
  ) {}

  private toSafeUser(user: User) {
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  private ensureAdminGeneral(currentUser: JwtPayload) {
    if (currentUser.role !== UserRole.ADMIN_GENERAL) {
      throw new ForbiddenException(
        'Solo el administrador general puede realizar esta operación',
      );
    }
  }

 private ensureBranchAdmin(
  currentUser: JwtPayload,
): string {
  if (
    currentUser.role !== UserRole.ADMIN_SUCURSAL ||
    !currentUser.branchId
  ) {
    throw new ForbiddenException(
      'No tienes permisos para administrar esta sucursal',
    );
  }

  return currentUser.branchId;
}

  private async findActiveBranch(branchId: string) {
    const branch = await this.branchesRepository.findOne({
      where: {
        id: branchId,
        isActive: true,
      },
    });

    if (!branch) {
      throw new NotFoundException(
        'La sucursal no existe o está inactiva',
      );
    }

    return branch;
  }

  private async findUserOrFail(id: string) {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: { branch: true },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  private ensureCanManageUser(
    currentUser: JwtPayload,
    targetUser: User,
  ) {
    if (currentUser.role === UserRole.ADMIN_GENERAL) {
      return;
    }

   const branchId = this.ensureBranchAdmin(currentUser);

    if (
      targetUser.role !== UserRole.EMPLEADO ||
      targetUser.branch?.id !== currentUser.branchId
    ) {
      throw new ForbiddenException(
        'Solo puedes administrar empleados de tu propia sucursal',
      );
    }
  }

  async create(
    createUserDto: CreateUserDto,
    currentUser: JwtPayload,
  ) {
    const email = createUserDto.email.trim().toLowerCase();

    const existingUser = await this.usersRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException(
        'El correo electrónico ya está registrado',
      );
    }

    let branch: Branch | null = null;

    if (currentUser.role === UserRole.ADMIN_SUCURSAL) {
  const branchId = this.ensureBranchAdmin(currentUser);
      if (createUserDto.role !== UserRole.EMPLEADO) {
        throw new ForbiddenException(
          'El administrador de sucursal solamente puede crear empleados',
        );
      }

      if (
        createUserDto.branchId &&
        createUserDto.branchId !== currentUser.branchId
      ) {
        throw new ForbiddenException(
          'No puedes asignar usuarios a otra sucursal',
        );
      }

      branch = await this.findActiveBranch(branchId);
    } else {
      this.ensureAdminGeneral(currentUser);

      if (createUserDto.role === UserRole.ADMIN_GENERAL) {
        if (createUserDto.branchId) {
          throw new BadRequestException(
            'El administrador general no debe tener sucursal asignada',
          );
        }
      } else {
        if (!createUserDto.branchId) {
          throw new BadRequestException(
            'Este usuario debe estar asociado a una sucursal',
          );
        }

        branch = await this.findActiveBranch(
          createUserDto.branchId,
        );
      }
    }

    const passwordHash = await hash(createUserDto.password, 12);

    const user = this.usersRepository.create({
      name: createUserDto.name.trim(),
      email,
      passwordHash,
      role: createUserDto.role,
      branch,
      isActive: true,
    });

    const savedUser = await this.usersRepository.save(user);

    return this.toSafeUser(savedUser);
  }

  async findAll(currentUser: JwtPayload) {
    let users: User[];

    if (currentUser.role === UserRole.ADMIN_GENERAL) {
      users = await this.usersRepository.find({
        relations: { branch: true },
        order: { createdAt: 'DESC' },
      });
    } else {
      const branchId = this.ensureBranchAdmin(currentUser);

users = await this.usersRepository.find({
  where: {
    branch: { id: branchId },
  },
  relations: { branch: true },
  order: { createdAt: 'DESC' },
});
    }

    return users.map((user) => this.toSafeUser(user));
  }

  async findOne(
    id: string,
    currentUser: JwtPayload,
  ) {
    const user = await this.findUserOrFail(id);

    this.ensureCanManageUser(currentUser, user);

    return this.toSafeUser(user);
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    currentUser: JwtPayload,
  ) {
    const user = await this.findUserOrFail(id);

    this.ensureCanManageUser(currentUser, user);

    if (currentUser.role === UserRole.ADMIN_SUCURSAL) {
      if (
        updateUserDto.role !== undefined ||
        updateUserDto.branchId !== undefined
      ) {
        throw new ForbiddenException(
          'No puedes modificar roles ni sucursales',
        );
      }
    }

    if (updateUserDto.email) {
      const email = updateUserDto.email.trim().toLowerCase();

      const existingUser = await this.usersRepository.findOne({
        where: { email },
      });

      if (existingUser && existingUser.id !== id) {
        throw new ConflictException(
          'El correo electrónico ya está registrado',
        );
      }

      user.email = email;
    }

    if (updateUserDto.name !== undefined) {
      user.name = updateUserDto.name.trim();
    }

    if (updateUserDto.password) {
      user.passwordHash = await hash(
        updateUserDto.password,
        12,
      );
    }

    if (currentUser.role === UserRole.ADMIN_GENERAL) {
      const newRole = updateUserDto.role ?? user.role;

      const branchId =
        updateUserDto.branchId !== undefined
          ? updateUserDto.branchId
          : user.branch?.id ?? null;

      if (newRole === UserRole.ADMIN_GENERAL) {
        if (branchId) {
          throw new BadRequestException(
            'El administrador general no debe tener sucursal asignada',
          );
        }

        user.branch = null;
      } else {
        if (!branchId) {
          throw new BadRequestException(
            'Este usuario debe estar asociado a una sucursal',
          );
        }

        user.branch = await this.findActiveBranch(branchId);
      }

      user.role = newRole;
    }

    const updatedUser = await this.usersRepository.save(user);

    return this.toSafeUser(updatedUser);
  }

  async deactivate(
    id: string,
    currentUser: JwtPayload,
  ) {
    const user = await this.findUserOrFail(id);

    this.ensureCanManageUser(currentUser, user);

    if (!user.isActive) {
      throw new BadRequestException(
        'El usuario ya está desactivado',
      );
    }

    user.isActive = false;

    const updatedUser = await this.usersRepository.save(user);

    return this.toSafeUser(updatedUser);
  }
}
