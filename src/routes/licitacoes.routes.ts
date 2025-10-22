// pncp-system-backend/src/routes/licitacoes.routes.ts
import { Elysia, t } from 'elysia';
import prisma from '@/db';
import { Prisma } from '@prisma/client';
import { analyzeAndFilterBids } from '@/services/analysisService'; // Ajuste o path
import { PncpLicitacao } from '@/lib/types'; // Ajuste o path
import { mapPrismaToPncp } from '@/lib/utils'; // Crie esta função utilitária

// Defina um schema para os filtros esperados no body
const FiltersSchema = t.Object({
     modalidades: t.Array(t.String()),
     dateRange: t.Optional(t.Object({ from: t.Optional(t.String()), to: t.Optional(t.String()) })),
     palavrasChave: t.Array(t.String()),
     valorMin: t.Optional(t.String()),
     valorMax: t.Optional(t.String()),
     estado: t.Optional(t.Nullable(t.String())),
     blacklist: t.Array(t.String()),
     useGeminiAnalysis: t.Optional(t.Boolean()),
});

export const licitacoesRoutes = new Elysia({ prefix: '/licitacoes' })
    .post('/buscar', async ({ body, request }) => {
        const filters = body.filters;
        const useGeminiAnalysis = filters.useGeminiAnalysis !== false;

        // Lógica de construção do 'where' do Prisma (similar à API route original)
         const where: Prisma.LicitacaoWhereInput = {};
         // ... (construa o where com base nos filters) ...

         const licitacoesBrutasDoDB = await prisma.licitacao.findMany({
             where,
             orderBy: { dataPublicacaoPncp: 'desc' },
             take: 20000,
         });

         const licitacoesBrutas = licitacoesBrutasDoDB.map(mapPrismaToPncp); // Use a função utilitária

        // Implementação do Stream (pode ser mais complexa em Elysia, talvez retornar o array completo seja mais simples inicialmente)
        // Exemplo simplificado retornando o array completo:
         if (useGeminiAnalysis) {
             // A função analyzeAndFilterBids precisa ser adaptada para não usar
             // a API de Stream do Next.js/Web, ou você precisa implementar
             // um streaming similar com Elysia/Bun.
             // Por simplicidade, vamos assumir que ela retorna o array filtrado.

             // Mock da função de progresso para Elysia (pode ser enviada via SSE se necessário)
             const onProgress = (update: any) => console.log('[Analysis Progress]', update.message);

             const licitacoesViaveis = await analyzeAndFilterBids(licitacoesBrutas, onProgress);
             return { type: 'result', resultados: licitacoesViaveis, totalBruto: licitacoesBrutas.length, totalFinal: licitacoesViaveis.length };
         } else {
             return { type: 'result', resultados: licitacoesBrutas, totalBruto: licitacoesBrutas.length, totalFinal: licitacoesBrutas.length };
         }

    }, {
        body: t.Object({ filters: FiltersSchema }), // Validar o body
        detail: { summary: 'Buscar licitações no banco de dados', tags: ['Licitações'] }
    });

// Adicione aqui a função mapPrismaToPncp ou coloque-a em src/lib/utils.ts