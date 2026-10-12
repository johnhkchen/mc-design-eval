import { buildHull } from "../hull.mjs";
import { carveRooms, carveLumens } from "../interior.mjs";
import { roomSlice } from "../anat.mjs";
const F = buildHull(); carveRooms(F); carveLumens(F);
for (const y of process.argv.slice(2).map(Number)) console.log(roomSlice(F,y));
