import type {Config} from 'drizzle-kit';

export default {
    schema: './apps/api/src/db/schema.ts',
    dialect: 'postgresql',
    dbCredentials: {
        url: 'postgres://postgres@localhost:5432/wordgames'
    },
    verbose: true,
    schemaFilter: ['auth', 'games'],
    out: './apps/api/drizzle'
} satisfies Config;
