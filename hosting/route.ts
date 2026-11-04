import { env } from 'cloudflare:workers';
import { createProvider } from '../../../server/provider.js';
let provider: ReturnType<typeof createProvider> | undefined;
export async function GET() {
 provider ??= createProvider({mode:'brapi',token:(env as unknown as Record<string,string>).BRAPI_TOKEN || ''});
 try { return Response.json(await provider(), {headers:{'Cache-Control':'no-store'}}); }
 catch { return Response.json({error:'Não foi possível consultar a fonte. Tente novamente em instantes.'},{status:503,headers:{'Cache-Control':'no-store'}}); }
}
