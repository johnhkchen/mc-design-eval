// Final ground heights [z][x] for the box: the map, plus the planned reshaping (parkway cut, bores, pond). Shared by build.mjs's ground and the terrain part.
import { readFileSync } from "node:fs";
import { mapHeight } from "../vocab.mjs";

const rows = readFileSync(new URL("./sitemap.txt", import.meta.url), "utf8").split("\n").filter(Boolean);
export const role = (x, z) => rows[z >> 1][x >> 1];

export function computeHeights() {
  const H = [];
  for (let z = 0; z < 146; z++) { H.push([]); for (let x = 0; x < 120; x++) H[z].push(mapHeight(x, z)); }
  // Parkway: road, walks and cut at y 4 from x 2 (x 0..1 keep the mapped height).
  for (let z = 76; z <= 95; z++) for (let x = 2; x <= 40; x++) H[z][x] = 4;
  // Portal face columns and bore volume stay at the road level so the portal part can build into air.
  for (let z = 76; z <= 95; z++) for (let x = 41; x <= 42; x++) H[z][x] = 4;
  for (let z = 79; z <= 92; z++) for (let x = 43; x <= 50; x++) H[z][x] = 4;
  // The parkway's sweep sits at the road level 4 (x 0..1 keep the mapped height).
  for (let z = 30; z <= 95; z++) for (let x = 2; x <= 40; x++) if (parkway(x, z)) H[z][x] = 4;
  // Pond sits sunken.
  for (let z = 24; z <= 25; z++) for (let x = 38; x <= 39; x++) H[z][x] = 2;
  return H;
}

// The Presidio Parkway west of the portal: a divided highway sweeping in from the west edge on one arc (centre
// (26, 46), radius 40) and running straight east into the cut on the centre line z 86. parkway(x, z) gives the
// cell's signed distance d from the centre line (south/outside positive), the run length s, and the carriageway's
// outer half-width (7 lanes-wide 1..8 on the sweep, 5 wide 1..6 in the cut where the bores fix the width), or null.
export function parkway(x, z) {
  if (x > 40) return null;
  const px = x + 0.5, pz = z + 0.5;
  let d, s;
  if (px >= 26) { d = pz - 86; s = px - 26; }
  else { if (pz < 46) return null; d = Math.hypot(px - 26, pz - 46) - 40; s = 40 * Math.atan2(px - 26, pz - 46); }
  const outer = x < 23 ? 8 : 6;
  if (Math.abs(d) >= outer + 1) return null;
  return { d, s, outer };
}
// Left-over paving of the old parking lot (W cells off the highway, x 2..45, z 30..95, not the cut): planted verge.
export const verge = (x, z) => x >= 2 && x <= 45 && z >= 30 && z <= 95 && role(x, z) === "W" && !parkway(x, z)
  && !(x >= 26 && z >= 76) && !(x >= 37 && x <= 40 && z >= 23 && z <= 26);
