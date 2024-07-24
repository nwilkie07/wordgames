import {drizzle} from 'drizzle-orm/node-postgres';
import 'dotenv/config';
import * as schema from './schema';
import postgres from 'postgres';

const queryClient = postgres('postgres://postgres@localhost:5432/wordgames');

export const db = drizzle(queryClient, {schema});
