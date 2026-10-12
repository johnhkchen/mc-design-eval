import { buildHull } from "../hull.mjs";
import { carveRooms, carveLumens } from "../interior.mjs";
import { sectionZ, sectionU } from "../anat.mjs";
const F = buildHull(); carveRooms(F); carveLumens(F);
for (const a of process.argv.slice(2)) { const k=a[0], n=Number(a.slice(1)); console.log(k==='z'?sectionZ(F,n):sectionU(F,n)); }
