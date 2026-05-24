import { UserRole } from '@prisma/client';

export interface AuthResponseDto {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
}
