// pncp-system-backend/src/modules/auth/auth.service.ts
import prisma from '@/db';
import bcrypt from 'bcryptjs';
import { User } from '@prisma/client'; // Importe o tipo User se necessário

export class AuthService {
  constructor(private readonly prismaClient: typeof prisma) {}

  async validateUser(email: string, pass: string): Promise<Omit<User, 'password'> | null> {
    const user = await this.prismaClient.user.findUnique({ where: { email } });
    if (user && user.password) {
      const isPasswordMatching = await bcrypt.compare(pass, user.password);
      if (isPasswordMatching) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...result } = user;
        return result;
      }
    }
    return null;
  }

  async registerUser(data: { name: string; email: string; password?: string }) {
     // Lógica para criar usuário (hash de senha, etc.)
     // Retorne o usuário criado (sem a senha)
  }

   async resetPassword(email: string) {
      // Lógica para gerar nova senha, hashear e atualizar no DB
      // Retorne a nova senha (ou status de sucesso)
   }
}