// pncp-system-backend/src/modules/auth/auth.routes.ts
import { Elysia, t } from 'elysia';
import { auth, authPlugin } from './auth.config'; // Supondo que authPlugin esteja aqui
import { AuthService } from './auth.service';
import prisma from '@/db';
import bcrypt from 'bcryptjs';

// Schema para registro (semelhante ao do frontend)
const registerUserSchemaBackend = t.Object({
    name: t.String({ minLength: 1 }),
    email: t.String({ format: 'email' }),
    password: t.String({ minLength: 6 }),
    invitationCode: t.String({ minLength: 1 }),
});

// Schema para reset (semelhante ao do frontend)
const resetPasswordSchemaBackend = t.Object({
   email: t.String({ format: 'email' }),
   secret: t.String({ minLength: 1 }),
});

export const authRoutes = new Elysia({ prefix: '/auth' })
    .decorate('authService', new AuthService(prisma))
    // Rota de Login (geralmente tratada pelo plugin better-auth, mas pode customizar)
    // Exemplo: .post('/login', async ({ body, auth, authService, set }) => { ... }, { body: auth.local?.credentialsSchema })

    // Rota de Registro
    .post('/register', async ({ body, authService, set }) => {
        const { name, email, password, invitationCode } = body;

         const secretCode = process.env.REGISTRATION_INVITE_CODE;
         if (!secretCode) {
            set.status = 503;
            return { message: "Registro desativado." };
         }
         if (invitationCode !== secretCode) {
             set.status = 403;
             return { message: "Código de convite inválido." };
         }

         const existingUser = await prisma.user.findUnique({ where: { email } });
         if (existingUser) {
             set.status = 409;
             return { message: "E-mail já registrado." };
         }

         const hashedPassword = await bcrypt.hash(password, 12);
         try {
             const user = await prisma.user.create({
                 data: { name, email, password: hashedPassword },
             });
             // eslint-disable-next-line @typescript-eslint/no-unused-vars
             const { password: _, ...userWithoutPassword } = user;
             set.status = 201;
             return userWithoutPassword;
         } catch (error) {
             console.error("Erro no registro:", error);
             set.status = 500;
             return { message: "Erro ao criar usuário." };
         }
    }, {
        body: registerUserSchemaBackend,
        detail: { summary: 'Registrar novo usuário', tags: ['Autenticação'] }
    })

    // Rota de Reset de Senha (adaptada da API route do Next.js)
    .post('/reset-password', async({ body, authService, set }) => {
        const { email, secret } = body;
        const RESET_SECRET = process.env.PASSWORD_RESET_SECRET;

         if (!RESET_SECRET) {
            set.status = 503;
            return { message: "Reset desativado." };
         }
         if (secret !== RESET_SECRET) {
             set.status = 401;
             return { message: "Segredo inválido." };
         }

         // Chamar a lógica do AuthService para resetar
         try {
            // Função para gerar senha aleatória (deve estar no AuthService ou utils)
             function generateRandomPassword(length = 12) {
                const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
                let password = "";
                for (let i = 0; i < length; i++) {
                    const randomIndex = Math.floor(Math.random() * charset.length);
                    password += charset[randomIndex];
                }
                return password;
            }

            const user = await prisma.user.findUnique({ where: { email } });
            if (!user) {
                set.status = 404;
                return { message: "Usuário não encontrado." };
            }
            const newPassword = generateRandomPassword();
            const hashedPassword = await bcrypt.hash(newPassword, 12);
            await prisma.user.update({
                where: { id: user.id },
                data: { password: hashedPassword },
            });

            return {
                message: `Senha para ${user.email} redefinida.`,
                newPassword: newPassword, // Retornar a senha aqui é uma decisão de segurança, considere alternativas
            };
         } catch (error) {
             console.error("Erro no reset:", error);
             set.status = 500;
             return { message: "Erro ao resetar senha." };
         }

    }, {
        body: resetPasswordSchemaBackend,
        detail: { summary: 'Resetar senha de usuário (requer segredo)', tags: ['Autenticação'] }
    });