function need(key: string): string {
  const v = process.env[key]
  if (!v) throw new Error(`Missing ${key} in apps/server/.env (see .env.example)`)
  return v
}

export const config = {
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: need('DATABASE_URL'),
  jwtSecret: new TextEncoder().encode(need('JWT_SECRET')),
  webOrigin: process.env.WEB_ORIGIN ?? 'http://localhost:5173',
  publicUrl: process.env.PUBLIC_URL ?? 'http://localhost:3000',
  paystackKey: process.env.PAYSTACK_SECRET_KEY || null,
  isProd: process.env.NODE_ENV === 'production',
}

if (config.paystackKey && !config.paystackKey.startsWith('sk_test_') && !config.isProd) {
  throw new Error('PAYSTACK_SECRET_KEY must be a test key (sk_test_...) outside production')
}
