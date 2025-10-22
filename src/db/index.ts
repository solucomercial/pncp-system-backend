// src/db/index.ts
import { PrismaClient } from '@prisma/client';

// Cria uma única instância do Prisma Client para ser usada na aplicação
const prisma = new PrismaClient();

export default prisma;