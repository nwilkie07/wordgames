import {createRootRoute, Outlet} from '@tanstack/react-router';
import {TanStackRouterDevtools} from '@tanstack/router-devtools';
import React, {useState} from 'react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {trpc} from '../../../api/src/app/client';
import { httpLink } from '@trpc/client';

export const Route = createRootRoute({
    component: Root
});

export default function Root() {
    const [queryClient] = useState(() => new QueryClient());
    const [trpcClient] = useState(() =>
        trpc.createClient({
            links: [
                httpLink({
                    url: 'http://localhost:3000/api',
                  headers: {
                      "mode": "no-cors"
                  }
                })
            ]
        })
    );

    return (
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
            <QueryClientProvider client={queryClient}>
                <Outlet />
                <TanStackRouterDevtools />
            </QueryClientProvider>
        </trpc.Provider>
    );
}
