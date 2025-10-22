// pncp-system-backend/src/routes/report.routes.ts
import { Elysia, t } from 'elysia';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { PncpLicitacao } from '@/lib/types'; // Ajuste o path

// Schema para o corpo da requisição
const ReportSchema = t.Object({
    licitacoes: t.Array(t.Any()) // Use um schema mais específico se possível
});

export const reportRoutes = new Elysia({ prefix: '/reports' })
    .post('/generate', async ({ body, set }) => {
        const { licitacoes } = body as { licitacoes: PncpLicitacao[] };

        if (!licitacoes || licitacoes.length === 0) {
             set.status = 400;
             return { message: 'Nenhuma licitação selecionada.' };
         }

        try {
             // Lógica de criação do DOCX (igual à da API route original)
            const sections = licitacoes.map((licitacao, index) => {
               // ... (código de criação dos Paragraphs) ...
               return { children: [] }; // Adapte o código original aqui
            }).flat();

            const doc = new Document({
                sections: [{ children: sections.flatMap(s => s.children) }],
            });

             const buffer = await Packer.toBuffer(doc);

             set.headers['Content-Type'] = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
             set.headers['Content-Disposition'] = `attachment; filename="relatorio-licitacoes.docx"`;
             set.status = 200;
             return buffer; // Elysia lida com Buffer diretamente

         } catch (error) {
             console.error('Erro ao gerar relatório:', error);
             set.status = 500;
             return { message: 'Erro interno ao gerar o relatório.' };
         }
    }, {
        body: ReportSchema,
        detail: { summary: 'Gerar relatório DOCX de licitações', tags: ['Relatórios'] }
    });