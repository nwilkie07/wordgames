import { initTRPC } from '@trpc/server';
import { db } from '../db/db';
import * as s from '../db/schema';
import { z } from 'zod';
import { llamaService } from '../lib/llama';

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
  generateHints: publicProcedure
    .input(
      z.object({
        letters: z.string(),
        centerLetter: z.string(),
        foundWords: z.array(z.string()),
        validWords: z.array(z.string()),
      }),
    )
    .mutation(async ({ input }) => {
      const { letters, centerLetter, foundWords, validWords } = input;
      const remainingCount = validWords.length - foundWords.length;

      const hints = await llamaService.generateHints({
        letters,
        centerLetter,
        foundWords,
        remainingCount,
        allValidWords: validWords,
      });

      return { hints };
    }),
});

// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;
