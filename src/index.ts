// src/index.ts
import { Elysia, t } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import prisma from './db'; // Importa a instância do Prisma

// Importar outros módulos (controllers) conforme forem criados
// import { authRoutes } from './modules/auth/auth.controller';
// ... outros módulos

const app = new Elysia()
  .use(cors({ /* ... configuração CORS ... */ }))
  .use(swagger({ /* ... configuração Swagger ... */ }))
  // Disponibiliza o cliente Prisma no contexto de cada requisição
  .decorate('db', prisma)
  .get('/', () => ({ message: 'PNCP Backend API is running!' }), {
     detail: { summary: 'Verifica o status da API', tags: ['Status'] }
  })
  // .group('/auth', app => app.use(authRoutes)) // Exemplo de como agrupar rotas
  // ... montar outros grupos de rotas
  .onError(({ code, error, set }) => {
    console.error(`[${code}] Error: ${error.message}`);
    if (code === 'NOT_FOUND') {
        set.status = 404;
        return { success: false, message: 'Rota não encontrada' };
    }
    if (code === 'VALIDATION') {
        set.status = 400;
        // Acessa os detalhes da validação via error.all (se disponível) ou error.message
        const details = (error as any).all || error.message;
        return { success: false, message: 'Erro de validação', errors: details };
    }
    set.status = 500;
    return { success: false, message: 'Erro interno do servidor' };
  })
  .listen(process.env.PORT || 3001);

console.log(`🦊 PNCP Backend running at ${app.server?.hostname}:${app.server?.port}`);
console.log(`📄 API Docs available at ${app.server?.hostname}:${app.server?.port}/api-docs`);

export type App = typeof app;