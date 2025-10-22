// src/modules/auth/auth.config.ts
import { BetterAuth } from "better-auth";
import { Elysia, t } from "elysia";
import { AuthService } from "./auth.service"; // Criaremos este serviço
import prisma from "../../db"; // Importa Prisma Client

/**
 * Define o schema (formato esperado) para os dados do usuário na sessão/token.
 */
const UserSessionSchema = t.Object({
  id: t.String(),
  email: t.String(),
  name: t.Optional(t.String()), // Nome pode ser opcional
});

/**
 * Configuração do BetterAuth.
 * Usaremos a estratégia 'local' (email/senha).
 */
export const auth = new BetterAuth<typeof UserSessionSchema>({
  // Chave secreta para assinar os tokens/cookies (use uma variável de ambiente!)
  secret: process.env.AUTH_SECRET || "fallback-secret-key-change-me", // !! MUDE ISSO E USE .env !!
  session: {
    // Configurações da sessão (cookie ou JWT)
    strategy: "jwt", // Usar JWT é comum para APIs separadas
    jwtOptions: {
      name: "auth_token", // Nome do cookie/header
      secret: process.env.AUTH_SECRET || "fallback-secret-key-change-me", // !! MUDE ISSO E USE .env !!
      // schema: UserSessionSchema, // Define o schema do payload JWT
      // Definir expiração do token (ex: 7 dias)
      expiresIn: "7d",
    },
    // Se usar cookies:
    // cookieOptions: {
    //   httpOnly: true,
    //   secure: process.env.NODE_ENV === 'production', // Use secure em produção (HTTPS)
    //   sameSite: 'lax', // Ou 'strict' ou 'none' dependendo da necessidade
    //   path: '/',
    // },
  },
  // Configuração da estratégia 'local' (email/senha)
  local: {
    /**
     * Função para verificar as credenciais do usuário.
     * @param credentials - Email e senha fornecidos pelo usuário.
     * @returns Os dados do usuário para a sessão se as credenciais forem válidas, ou null caso contrário.
     */
    async verify(credentials) {
      if (!credentials.email || !credentials.password) {
        console.warn("[Auth Verify] Email ou senha não fornecidos.");
        return null;
      }

      console.log(`[Auth Verify] Tentando login para: ${credentials.email}`);
      const authService = new AuthService(prisma);
      const user = await authService.validateUser(
        credentials.email,
        credentials.password
      );

      if (user) {
        console.log(`[Auth Verify] Usuário validado: ${user.email}`);
        // Retorna apenas os dados definidos no UserSessionSchema
        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined, // Garante que name seja string ou undefined
        };
      } else {
        console.warn(`[Auth Verify] Falha na validação para: ${credentials.email}`);
        return null;
      }
    },
    // Define os campos esperados no corpo da requisição de login
    credentialsSchema: t.Object({
      email: t.String({ format: "email" }),
      password: t.String(),
    }),
  },
});

// Plugin Elysia para integrar o BetterAuth
export const authPlugin = new Elysia({ name: 'auth-plugin' })
    .decorate('auth', auth) // Torna 'auth' acessível no contexto (ctx.auth)
    .use(auth.elysia);     // Aplica middlewares e rotas padrão do BetterAuth (se houver)