import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { db, sql } from './index.js'

await migrate(db, { migrationsFolder: './drizzle' })
console.log('Migrations applied')
await sql.end()
