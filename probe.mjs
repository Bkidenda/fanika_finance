import { createServer } from 'vite';
const server = await createServer({ configFile: 'vite.config.ts', server: { middlewareMode: true } });
try {
  const modClient = await server.transformRequest('/src/lib/advisor.functions.ts');
  console.log('=== CLIENT/BROWSER TRANSFORM ===');
  console.log(modClient.code.slice(0, 3000));
} catch (e) { console.log('client transform err', e.message); }
try {
  const modSsr = await server.transformRequest('/src/lib/advisor.functions.ts', { ssr: true });
  console.log('=== SSR TRANSFORM ===');
  console.log(modSsr.code.slice(0, 3000));
} catch (e) { console.log('ssr transform err', e.message); }
await server.close();
