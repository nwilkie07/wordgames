import { initTRPC } from '@trpc/server';
import { db } from '../db/db';
import * as s from '../db/schema';

const t = initTRPC.context().create();

/**
 * Export reusable router and procedure helpers
 * that can be used throughout the router
 */
export const router = t.router;
export const publicProcedure = t.procedure;

export const appRouter = router({
  createWordsTable: publicProcedure.mutation(() => {
    return db.transaction(async (tx) => {
      await tx
        .insert(s.words)
        .values({ word: 'Task', length: 4, pure: true })
        .returning();
    });
  }),
  testMethod: publicProcedure.query(async () => {
    console.log('Done it');
    return 'test';
  }),
});

// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;
