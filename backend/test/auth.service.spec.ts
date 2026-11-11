import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UnauthorizedException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../src/auth/auth.service.js';
import { User } from '../src/users/entities/user.entity.js';

const { compareMock } = vi.hoisted(() => ({
  compareMock: vi.fn(async (_password: string, _hash: string) => true),
}));

vi.mock('bcryptjs', () => ({
  compare: compareMock,
}));

describe('AuthService', () => {
  const usersRepository = {
    findOne: vi.fn(),
  };
  let service: AuthService;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: usersRepository },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('normalizes the email and returns only safe user fields', async () => {
    const user = {
      id: 'user-1',
      name: 'Ana',
      email: 'ana@example.com',
      passwordHash: 'stored-hash',
      role: 'empleado',
      isActive: true,
      branch: { id: 'branch-1' },
    };
    usersRepository.findOne.mockResolvedValue(user);
    compareMock.mockResolvedValue(true);

    await expect(
      service.validateCredentials('  ANA@EXAMPLE.COM ', 'password'),
    ).resolves.toEqual({
      id: 'user-1',
      name: 'Ana',
      email: 'ana@example.com',
      role: 'empleado',
      branchId: 'branch-1',
    });

    expect(usersRepository.findOne).toHaveBeenCalledWith({
      where: { email: 'ana@example.com' },
      relations: { branch: true },
    });
    expect(compareMock).toHaveBeenCalledWith('password', 'stored-hash');
  });

  it('rejects unknown, inactive, or invalid-password users', async () => {
    usersRepository.findOne.mockResolvedValue(null);
    await expect(
      service.validateCredentials('missing@example.com', 'password'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(compareMock).not.toHaveBeenCalled();

    usersRepository.findOne.mockResolvedValue({
      isActive: false,
      passwordHash: 'stored-hash',
    });
    await expect(
      service.validateCredentials('inactive@example.com', 'password'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(compareMock).not.toHaveBeenCalled();

    usersRepository.findOne.mockResolvedValue({
      isActive: true,
      passwordHash: 'stored-hash',
    });
    compareMock.mockResolvedValue(false);
    await expect(
      service.validateCredentials('valid@example.com', 'wrong'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('returns a null branch id when the user has no branch', async () => {
    usersRepository.findOne.mockResolvedValue({
      id: 'admin-1',
      name: 'Admin',
      email: 'admin@example.com',
      passwordHash: 'stored-hash',
      role: 'admin_general',
      isActive: true,
      branch: null,
    });
    compareMock.mockResolvedValue(true);

    await expect(
      service.login('admin@example.com', 'password'),
    ).resolves.toMatchObject({ id: 'admin-1', branchId: null });
  });
});
