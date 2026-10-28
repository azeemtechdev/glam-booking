import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { config } from '../config.js'
import * as schema from './schema.js'

// Supabase Postgres. Use the pooler connection string from Project Settings > Database.
// The transaction pooler (port 6543) does not support prepared statements, so they are off.
const local = /@(localhost|127\.0\.0\.1)[:/]/.test(config.databaseUrl)
export const sql = postgres(config.databaseUrl, { prepare: false, ssl: local ? false : 'require', max: 10 })
export const db = drizzle(sql, { schema })
export type Db = typeof db
