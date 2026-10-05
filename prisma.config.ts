import dotenv from 'dotenv'
import { defineConfig } from 'prisma/config'

dotenv.config({ path: '.env.local' })

export default defineConfig({
	schema: 'prisma/schema.prisma',
	migrations: { path: 'prisma/migrations' },
	datasource: {
		url:
			process.env.DATABASE_URL ??
			'postgresql://postgres:postgres@localhost:5432/flowboard?schema=public',
	},
})
