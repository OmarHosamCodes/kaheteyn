import { db } from "@kaheteyn/db";
import { account, user } from "@kaheteyn/db/schema";
import { TRPCError } from "@trpc/server";
import { hashPassword } from "better-auth/crypto";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure, router } from "../index";
import { logAudit } from "../lib";

function generateId(): string {
	return crypto.randomUUID().replace(/-/g, "");
}

export const adminsRouter = router({
	list: protectedProcedure.query(async () => {
		const rows = await db
			.select({
				id: user.id,
				name: user.name,
				email: user.email,
				username: user.username,
				createdAt: user.createdAt,
				role: user.role,
			})
			.from(user)
			.orderBy(user.createdAt);
		return rows;
	}),

	create: protectedProcedure
		.input(
			z.object({
				name: z.string().min(1, "الاسم مطلوب"),
				username: z
					.string()
					.min(3, "اسم المستخدم يجب أن يكون 3 أحرف على الأقل"),
				email: z.string().email("البريد الإلكتروني غير صالح"),
				password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Check for existing username or email
			const [existingEmail] = await db
				.select({ id: user.id })
				.from(user)
				.where(eq(user.email, input.email));
			if (existingEmail) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "البريد الإلكتروني مستخدم بالفعل",
				});
			}

			const [existingUsername] = await db
				.select({ id: user.id })
				.from(user)
				.where(eq(user.username, input.username));
			if (existingUsername) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "اسم المستخدم مستخدم بالفعل",
				});
			}

			const hashedPassword = await hashPassword(input.password);

			const userId = generateId();
			const accountId = generateId();

			const [newUser] = await db
				.insert(user)
				.values({
					id: userId,
					name: input.name,
					email: input.email,
					emailVerified: true,
					username: input.username,
					displayUsername: input.username,
					role: "admin",
				})
				.returning();

			await db.insert(account).values({
				id: accountId,
				accountId: input.email,
				providerId: "credential",
				userId,
				password: hashedPassword,
			});

			await logAudit({
				actorId: ctx.session.user.id,
				actorName: ctx.session.user.name,
				entityType: "user",
				entityId: userId,
				action: "create",
				newValue: {
					name: input.name,
					username: input.username,
					email: input.email,
				},
			});

			return newUser;
		}),

	setPassword: protectedProcedure
		.input(
			z.object({
				userId: z.string(),
				newPassword: z
					.string()
					.min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const [targetUser] = await db
				.select({ id: user.id, name: user.name })
				.from(user)
				.where(eq(user.id, input.userId));
			if (!targetUser) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "المستخدم غير موجود",
				});
			}

			const hashedPassword = await hashPassword(input.newPassword);

			const updated = await db
				.update(account)
				.set({ password: hashedPassword })
				.where(eq(account.userId, input.userId))
				.returning();

			if (updated.length === 0) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "لم يُعثر على بيانات الحساب",
				});
			}

			await logAudit({
				actorId: ctx.session.user.id,
				actorName: ctx.session.user.name,
				entityType: "user",
				entityId: input.userId,
				action: "update",
				newValue: { passwordChanged: true },
			});

			return { ok: true };
		}),
});
