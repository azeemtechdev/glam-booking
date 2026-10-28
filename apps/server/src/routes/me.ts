import { eq } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { db } from '../db/index.js'
import { users } from '../db/schema.js'
import { parse } from '../lib/errors.js'
import { requireUser, userDto } from '../lib/session.js'

const phone = z.string().transform((s) => s.replace(/\s/g, '')).pipe(z.string().regex(/^\+?\d{10,15}$/, 'enter a valid phone number'))

export default async function meRoutes(app: FastifyInstance) {
  app.get('/me', async (req) => userDto(await requireUser(req)))

  app.patch('/me', async (req) => {
    const u = await requireUser(req)
    const b = parse(z.object({
      name: z.string().trim().min(2).max(100).optional(),
      photo_url: z.string().max(500).optional(),
      area: z.string().trim().max(100).optional(),
    }), req.body)
    const [next] = await db.update(users).set({ name: b.name, photoUrl: b.photo_url, area: b.area }).where(eq(users.id, u.id)).returning()
    return userDto(next!)
  })

  app.put('/me/emergency-contact', async (req, reply) => {
    const u = await requireUser(req)
    const b = parse(z.object({ name: z.string().trim().min(1, 'enter a name').max(100), phone }), req.body)
    await db.update(users).set({ emergencyName: b.name, emergencyPhone: b.phone }).where(eq(users.id, u.id))
    return reply.code(204).send()
  })
}
