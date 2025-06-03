// import { PrismaClient } from '@prisma/client';
// import { neonConfig } from '@neondatabase/serverless';

import ws from 'ws';

let prismaInstance: any = null;

async function getPrismaClient() {
    if (!prismaInstance) {
        const prismaNeon = await import('@prisma/adapter-neon');
        const { PrismaClient } = await import('@prisma/client');
        const neon = await import('@neondatabase/serverless');

        neon.neonConfig.webSocketConstructor = ws;
        neon.neonConfig.poolQueryViaFetch = true
        
        const viteDatabaseUrl = process?.env?.DATABASE_URL || import.meta.env.VITE_DATABASE_URL;
        const adapter = new prismaNeon.PrismaNeon({ connectionString: viteDatabaseUrl });
        prismaInstance = new PrismaClient({ adapter });
    }
    return prismaInstance;
}

export default getPrismaClient;