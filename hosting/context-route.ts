import {createOfficialProvider} from '../../../server/official-sources.js';
const provider=createOfficialProvider();
export async function GET() {
  return Response.json(await provider(),{headers:{'Cache-Control':'no-store'}});
}
