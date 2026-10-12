import { buildHull } from "../hull.mjs";
import { frontView, slice } from "../anat.mjs";
const F = buildHull();
console.log(frontView(F));
for (const y of (process.argv.slice(2).map(Number))) console.log(slice(F,y));
