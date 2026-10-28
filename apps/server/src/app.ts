import cors from '@fastify/cors'
import Fastify, { type FastifyError } from 'fastify'
import { config } from './config.js'
import { HttpError } from './lib/errors.js'
import authRoutes from './routes/auth.js'
import meRoutes from './routes/me.js'

export async function buildApp() {
  const app = Fastify({ logger: { level: config.isProd ? 'info' : 'warn' }, bodyLimit: 1_000_000 })

  await app.register(cors, {
    origin: config.webOrigin,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
  })

  app.setErrorHandler((err: FastifyError | HttpError, req, reply) => {
    if (err instanceof HttpError) return reply.code(err.status).send({ error: { code: err.code, message: err.message } })
    if (err.statusCode && err.statusCode < 500) {
      return reply.code(err.statusCode).send({ error: { code: 'BAD_REQUEST', message: 'The request could not be read. Please try again.' } })
    }
    req.log.error(err)
    return reply.code(500).send({ error: { code: 'SERVER_ERROR', message: 'Something went wrong on our side. Please try again.' } })
  })
  app.setNotFoundHandler((_req, reply) => reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Not found.' } }))

  app.get('/health', async () => ({ ok: true }))
  await app.register(async (v1) => {
    await v1.register(authRoutes)
    await v1.register(meRoutes)
  }, { prefix: '/v1' })

  return app
}
