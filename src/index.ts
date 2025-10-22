// pncp-system-backend/src/index.ts
import { Elysia, t } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import prisma from './db';
import { authRoutes } from './modules/auth/auth.routes'; // Importar rotas de auth
import { licitacoesRoutes } from './routes/licitacoes.routes'; // Importar rotas de licitações
import { reportRoutes } from './routes/report.routes'; // Importar rotas de relatório
import { syncRoutes } from './routes/sync.routes'; // Importar rotas de sync

const app = new Elysia()
    .use(cors({
         origin: process.env.FRONTEND_URL || 'http://localhost:3000', // Permitir origem do frontend
         methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
         allowedHeaders: ['Content-Type', 'Authorization'],
         credentials: true,
    }))
    .use(swagger({ path: '/api-docs' })) // Mudar path se desejado
    .decorate('db', prisma)
    .get('/', () => ({ message: 'PNCP Backend API is running!' }), {
        detail: { summary: 'Verifica o status da API', tags: ['Status'] }
    })
    .use(authRoutes)       // Usar as rotas de autenticação
    .use(licitacoesRoutes) // Usar as rotas de licitações
    .use(reportRoutes)     // Usar as rotas de relatório
    .use(syncRoutes)       // Usar as rotas de sync
    .onError(({ code, error, set }) => {
        console.error(`[${code}] Error: ${error.message}`, error.stack); // Logar stack trace
        // ... (resto do tratamento de erro)
        if (code === 'VALIDATION') {
            set.status = 400;
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