// pncp-system-backend/src/routes/sync.routes.ts
import { Elysia, t } from 'elysia';
import { runSync } from '@/services/syncService'; // Ajuste o path

const CRON_SECRET = process.env.CRON_SECRET;

export const syncRoutes = new Elysia({ prefix: '/sync' })
    .post('/', async ({ request, query, set }) => {
        const authorization = request.headers.get('authorization');

        if (authorization !== `Bearer ${CRON_SECRET}`) {
            set.status = 401;
            return { message: 'Acesso não autorizado.' };
        }

        const isInitialLoad = query.initial_load === 'true';

         try {
             console.log(`[API Sync Backend] Recebida requisição (Initial Load: ${isInitialLoad}).`);
             const result = await runSync(isInitialLoad); // runSync precisa estar no backend agora

             if (result.success) {
                 return { message: result.message };
             } else {
                 set.status = 500;
                 return { message: result.message };
             }
         } catch (error) {
             console.error('[API Sync Backend] Erro:', error);
             const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido.';
             set.status = 500;
             return { message: 'Erro interno.', error: errorMessage };
         }
    }, {
        query: t.Object({ initial_load: t.Optional(t.String()) }), // Validar query param
        detail: { summary: 'Disparar sincronização com PNCP (requer segredo)', tags: ['Sincronização'] }
    });