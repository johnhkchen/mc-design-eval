// SEA1270099650: 1962 World's Fair era low exhibit pavilion, Pacific Science Center campus (Seattle Center).
// Box 18 x 19 (x0=83, z0=249), footprint 335 cells, one notch missing at the NE corner.
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";
import { readFileSync } from "node:fs";

const X0 = 83, Z0 = 249, W = 18, D = 19, HMAX = 11;
const manifest = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/out/seattle/space-needle/manifest.json", "utf8"));
const b = manifest.buildings.find((q) => q.id === "SEA1270099650");
const FOOT = new Set(b.footprint.map(([x, z]) => `${x - X0},${z - Z0}`));
const inFoot = (x, z) => FOOT.has(`${x},${z}`);
const nb4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const isEdge = (x, z) => inFoot(x, z) && nb4.some(([dx, dz]) => !inFoot(x + dx, z + dz));
// corner: exposed on two perpendicular sides
const isCorner = (x, z) => {
  const ex = !inFoot(x + 1, z) || !inFoot(x - 1, z);
  const ez = !inFoot(x, z + 1) || !inFoot(x, z - 1);
  return ex && ez;
};

const g = new Voxels([W, HMAX, D]);
const cells = [];
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) if (inFoot(x, z)) cells.push([x, z]);
const edge = cells.filter(([x, z]) => isEdge(x, z));
// pier: corners, and every third edge cell along the ring (x+z mod 3), others are slit windows
const isPier = (x, z) => isCorner(x, z) || (x + z) % 3 === 0;
const isSlit = (x, z) => isEdge(x, z) && !isPier(x, z);

const LANTERN = { x0: 7, x1: 11, z0: 7, z1: 11 };
const inLantern = (x, z) => x >= LANTERN.x0 && x <= LANTERN.x1 && z >= LANTERN.z0 && z <= LANTERN.z1;
const lanternEdge = (x, z) => inLantern(x, z) && (x === LANTERN.x0 || x === LANTERN.x1 || z === LANTERN.z0 || z === LANTERN.z1);
const VENTS = [[3, 9], [14, 9], [3, 14], [14, 14]];
const ENTRY = { xs: [8, 9], zEdge: D - 1 };
const CANOPY = { xs: [6, 7, 8, 9, 10, 11], zs: [16, 17, 18] };

// 1. foundation and darker base course, y 0-1, under the whole footprint
for (const [x, z] of cells) { g.set(x, 0, z, "gray_concrete"); g.set(x, 1, z, "gray_concrete"); }

// 2. walls, y 2-3: white piers, tall glass slit windows between them, entrance bay left for the doors
for (const [x, z] of edge) {
  const entry = z === ENTRY.zEdge && ENTRY.xs.includes(x);
  if (entry) { /* doors placed below */ continue; }
  for (const y of [2, 3]) {
    if (isSlit(x, z)) g.set(x, y, z, "glass");
    else g.set(x, y, z, "white_concrete");
  }
}

// 3. clerestory: continuous glass band at y 4 under the roof, canopy replaces it over the entrance
for (const [x, z] of edge) {
  const canopy = CANOPY.xs.includes(x) && CANOPY.zs.includes(z);
  if (canopy) g.set(x, 4, z, "quartz_slab", { type: "bottom", waterlogged: "false" });
  else g.set(x, 4, z, "glass");
}

// 4. light-blue accent band (fascia) at y 5 on the whole edge
for (const [x, z] of edge) g.set(x, 5, z, "light_blue_concrete");

// 5. roof deck y 6: solid quartz inside, thin quartz_slab overhang edge on the perimeter (kept inside footprint)
for (const [x, z] of cells) {
  if (isEdge(x, z)) g.set(x, 6, z, "quartz_slab", { type: "bottom", waterlogged: "false" });
  else g.set(x, 6, z, "quartz_block");
}

// 6. double entrance doors at the south edge, y 2-3 (iron, facing out, hinges opposite)
for (const [i, x] of ENTRY.xs.entries()) {
  const hinge = i === 0 ? "left" : "right";
  const facing = "south";
  g.set(x, 2, ENTRY.zEdge, "iron_door", { facing, half: "lower", hinge, open: "false", powered: "false" });
  g.set(x, 3, ENTRY.zEdge, "iron_door", { facing, half: "upper", hinge, open: "false", powered: "false" });
}

// 7. central raised skylight lantern: light-gray frame, glass infill, y 7-10
for (const [x, z] of cells) {
  if (!inLantern(x, z)) continue;
  for (let y = 7; y <= 9; y++) {
    if (lanternEdge(x, z)) g.set(x, y, z, "light_gray_concrete");
    else g.set(x, y, z, "glass");
  }
  if (lanternEdge(x, z)) g.set(x, 10, z, "light_gray_concrete");
  else g.set(x, 10, z, "glass");
}

// 8. roof vents: short light-gray stacks on the deck, y 7-8
for (const [x, z] of VENTS) {
  if (!inFoot(x, z) || inLantern(x, z)) continue;
  g.set(x, 7, z, "light_gray_concrete");
  g.set(x, 8, z, "light_gray_concrete");
}

// 9. foundation for the lantern and vents is the deck itself (y 6), nothing else on the roof
const r = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/seattle-fill/SEA1270099650.nbt");
console.log(JSON.stringify({ size: [W, HMAX, D], ...r, edge: edge.length, piers: edge.filter(([x, z]) => isPier(x, z)).length, slits: edge.filter(([x, z]) => isSlit(x, z)).length }));
