import { AppRouter, appRouter, publicProcedure, router } from './app/trpc';
import {
  fastifyTRPCPlugin,
  FastifyTRPCPluginOptions,
} from '@trpc/server/adapters/fastify';
import fastify from 'fastify';
import { createContext } from './app/context';
import { TRPCError } from '@trpc/server';
import * as z from "zod"

//Copied from https://orm.drizzle.team/learn/guides/upsert
// const buildConflictUpdateColumns = <
//     T extends PgTable,
//     Q extends keyof T['_']['columns']
// >(
//     table: T,
//     columns: Q[]
// ) => {
//     const cls = getTableColumns(table);
//     return columns.reduce(
//         (acc, column) => {
//             const colName = cls[column]?.name;
//             acc[column] = sql.raw(`excluded.${colName}`);
//             return acc;
//         },
//         {} as Record<Q, SQL>
//     );
// };



const server = fastify({
  maxParamLength: 5000,
});
server.register(fastifyTRPCPlugin, {
  prefix: 'api',
  trpcOptions: {
    router: appRouter,
    createContext,
    onError({ path, error }) {
      // report to error monitoring
      console.error(`Error in tRPC handler on path '${path}':`, error);
    },
  } satisfies FastifyTRPCPluginOptions<AppRouter>['trpcOptions'],
});
(async () => {
  try {
    await server.listen({ port: 3000 });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
})();
