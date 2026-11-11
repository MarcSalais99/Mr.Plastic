import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UsersService } from '../src/users/users.service.js';
import { User } from '../src/users/entities/user.entity.js';
import { Branch } from '../src/branches/entities/branch.entity.js';
import { UserRole } from '../src/users/enums/user-role.enum.js';

const { hashMock } = vi.hoisted(() => ({
  hashMock: vi.fn(async (_password: string, _rounds: number) => 'secure-hash'),
}));

vi.mock('bcryptjs', () => ({
  hash: hashMock,
}));

describe('UsersService', () => {
  const usersRepository = {
    findOne: vi.fn(),
    find: vi.fn(),
    create: vi.fn(),
    save: vi.fn(),
  };
  const branchesRepository = {
    findOne: vi.fn(),
  };
  let service: UsersService;

  const admin: { sub: string; email: string; role: string; branchId: null } = {
    sub: 'admin-1',
    email: 'admin@example.com',
    role: UserRole.ADMIN_GENERAL,
    branchId: null,
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: usersRepository },
        { provide: getRepositoryToken(Branch), useValue: branchesRepository },
      ],
    }).compile();
    service = module.get(UsersService);
  });

  it('creates users with normalized input and omits the password hash', async () => {
    const branch = { id: 'branch-1', isActive: true };
    const dto = {
      name: '  Ana  ',
      email: ' ANA@EXAMPLE.COM ',
      password: 'password123',
      role: UserRole.EMPLEADO,
      branchId: 'branch-1',
    };
    usersRepository.findOne.mockResolvedValue(null);
    branchesRepository.findOne.mockResolvedValue(branch);
    hashMock.mockResolvedValue('secure-hash');
    usersRepository.create.mockImplementation((user) => user);
    usersRepository.save.mockImplementation(async (user) => ({
      ...user,
      id: 'user-1',
    }));

    const result = await service.create(dto, admin);

    expect(result).toMatchObject({
      id: 'user-1',
      name: 'Ana',
      email: 'ana@example.com',
      role: UserRole.EMPLEADO,
      branch,
    });
    expect(result).not.toHaveProperty('passwordHash');
    expect(usersRepository.findOne).toHaveBeenCalledWith({
      where: { email: 'ana@example.com' },
    });
    expect(hashMock).toHaveBeenCalledWith('password123', 12);
  });

  it('rejects duplicate email and invalid branch assignments', async () => {
    usersRepository.findOne.mockResolvedValue({ id: 'existing-user' });
    await expect(
      service.create(
        {
          name: 'Ana',
          email: 'ana@example.com',
          password: 'password123',
          role: UserRole.EMPLEADO,
          branchId: 'branch-1',
        },
        admin,
      ),
    ).rejects.toBeInstanceOf(ConflictException);

    usersRepository.findOne.mockResolvedValue(null);
    await expect(
      service.create(
        {
          name: 'Admin',
          email: 'other@example.com',
          password: 'password123',
          role: UserRole.ADMIN_GENERAL,
          branchId: 'branch-1',
        },
        admin,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('limits branch admins to creating employees in their own active branch', async () => {
    const branchAdmin = {
      sub: 'branch-admin',
      email: 'branch@example.com',
      role: UserRole.ADMIN_SUCURSAL,
      branchId: 'branch-1',
    };
    usersRepository.findOne.mockResolvedValue(null);
    const employeeDto = {
      name: 'Empleado',
      email: 'employee@example.com',
      password: 'password123',
      role: UserRole.EMPLEADO,
    };
    branchesRepository.findOne.mockResolvedValue({ id: 'branch-1' });
    hashMock.mockResolvedValue('secure-hash');
    usersRepository.create.mockImplementation((user) => user);
    usersRepository.save.mockImplementation(async (user) => user);

    await service.create(employeeDto, branchAdmin);
    expect(branchesRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'branch-1', isActive: true },
    });

    await expect(
      service.create(
        { ...employeeDto, email: 'manager@example.com', role: UserRole.ADMIN_SUCURSAL },
        branchAdmin,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('scopes branch-admin listings to their branch and removes password hashes', async () => {
    const branchAdmin = {
      sub: 'branch-admin',
      email: 'branch@example.com',
      role: UserRole.ADMIN_SUCURSAL,
      branchId: 'branch-1',
    };
    const users = [
      { id: 'user-1', passwordHash: 'secret', branch: { id: 'branch-1' } },
    ];
    usersRepository.find.mockResolvedValue(users);

    await expect(service.findAll(branchAdmin)).resolves.toEqual([
      { id: 'user-1', branch: { id: 'branch-1' } },
    ]);
    expect(usersRepository.find).toHaveBeenCalledWith({
      where: { branch: { id: 'branch-1' } },
      relations: { branch: true },
      order: { createdAt: 'DESC' },
    });
  });

  it('prevents branch admins from managing users outside their branch', async () => {
    const branchAdmin = {
      sub: 'branch-admin',
      email: 'branch@example.com',
      role: UserRole.ADMIN_SUCURSAL,
      branchId: 'branch-1',
    };
    usersRepository.findOne.mockResolvedValue({
      id: 'user-2',
      role: UserRole.EMPLEADO,
      branch: { id: 'branch-2' },
    });

    await expect(
      service.findOne('user-2', branchAdmin),
    ).rejects.toBeInstanceOf(ForbiddenException);

    usersRepository.findOne.mockResolvedValue(null);
    await expect(service.findOne('missing', admin)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('deactivates an active user and rejects repeated deactivation', async () => {
    const user = {
      id: 'user-1',
      role: UserRole.EMPLEADO,
      branch: { id: 'branch-1' },
      isActive: true,
      passwordHash: 'secret',
    };
    usersRepository.findOne.mockResolvedValue(user);
    usersRepository.save.mockImplementation(async (savedUser) => savedUser);

    const result = await service.deactivate('user-1', admin);
    expect(user.isActive).toBe(false);
    expect(result).not.toHaveProperty('passwordHash');

    await expect(
      service.deactivate('user-1', admin),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
