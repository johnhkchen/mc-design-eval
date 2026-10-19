// DC86819: a two-storey Neoclassical office block, 8 x 33 cells on the Mall, in pale limestone (calcite) with a
// polished granite base, quartz piers and string courses, glazed bays on the long and end faces, a bronze-look
// entrance on the west face, and a stone roof with a quartz cornice. The footprint is solid at y0 (floor) and y3
// (floor slab) and y6 (roof); the walls are the outer ring, one cell thick, with an air gap inside every glass pane.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${HERE}/DC86819.cells.json`, "utf8"));   // [x, z, ground, roof]

// Lidar roof is 6 over most of the footprint and 7 in 51 cells (noise); the brief says about 7, so one flat tier at 7.
const ROOF = 7;
const W = 8, D = 33;
const foot = new Map(cells.map(([x, z, g]) => [`${x},${z}`, g]));
const inFoot = (x, z) => foot.has(`${x},${z}`);
const exterior = (x, z) => !inFoot(x - 1, z) || !inFoot(x + 1, z) || !inFoot(x, z - 1) || !inFoot(x, z + 1);

const g = new Voxels([W, ROOF + 12, D]);

const pane = (north, south, east, west) => ({ north: String(north), south: String(south), east: String(east), west: String(west), waterlogged: "false" });

// Every footprint cell: foundation from y0 up to its own ground (all 0 here, so nothing), then the floor slabs.
for (const [x, z, ground] of cells) {
  for (let y = 0; y < ground; y++) g.set(x, y, z, "polished_granite");
  g.set(x, 0, z, exterior(x, z) ? "polished_granite" : "smooth_stone");     // base course / ground floor
  g.set(x, 3, z, exterior(x, z) ? "smooth_quartz" : "smooth_stone");        // string course / upper floor slab
  g.set(x, 6, z, exterior(x, z) ? "chiseled_quartz_block" : "stone");       // cornice / flat roof
}

// Outer ring: piers on even bays, glazed bays on odd ones; the corners are piers. Long faces are x=0 (west) and
// x=7 (east), indexed by z; end faces are z=0 (north) and z=32 (south), indexed by x.
const entranceZ = 16;
for (const [x, z] of cells) {
  if (!exterior(x, z)) continue;
  const corner = (x === 0 || x === W - 1) && (z === 0 || z === D - 1);
  const longFace = x === 0 || x === W - 1;
  const endFace = z === 0 || z === D - 1;
  const idx = longFace && !endFace ? z : x;
  const pier = corner || idx % 2 === 0;
  for (const y of [1, 2, 4, 5]) {
    if (longFace && x === 0 && z === entranceZ && y <= 2) {
      g.set(x, y, z, "iron_door", { facing: "west", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    // Quartz surround either side of the entrance door at ground level.
    if (longFace && x === 0 && (z === entranceZ - 1 || z === entranceZ + 1) && y <= 2) { g.set(x, y, z, "smooth_quartz"); continue; }
    if (pier) { g.set(x, y, z, "smooth_quartz"); continue; }
    g.set(x, y, z, "glass_pane", longFace && !endFace ? pane(true, true, false, false) : pane(false, false, true, true));
  }
}
// Entrance lintel/canopy: a granite course across the door bay at the string line, above the door.
for (const z of [entranceZ - 1, entranceZ, entranceZ + 1]) g.set(0, 3, z, "polished_granite");
// Stone head over the door at the upper storey, so the bay reads as one portal.
for (const z of [entranceZ - 1, entranceZ, entranceZ + 1]) g.set(0, 4, z, "chiseled_quartz_block");

// Interior: an air gap behind the glass (x=1 west, z=1 north ...), warm light in some bays, lanterns on the floor
// and hanging from the slab. Glowstone sits two cells in, so there is always air between it and the pane.
for (let z = 2; z < D - 2; z += 8) {
  g.set(3, 2, z, "lantern", { hanging: "true", waterlogged: "false" });   // ground storey, hung from the slab
  g.set(3, 4, z + 4, "lantern", { hanging: "false", waterlogged: "false" }); // upper storey, standing on the slab
}
for (const z of [5, 13, 21, 29]) g.set(2, 1, z, "glowstone");
for (const z of [9, 17, 25]) g.set(2, 4, z, "glowstone");

// Roof: two plant units standing on the flat roof.
for (const [x0, z0] of [[1, 6], [5, 24]]) for (let x = x0; x < x0 + 2; x++) for (let z = z0; z < z0 + 2; z++) g.set(x, ROOF, z, "iron_block");
g.set(3, ROOF, 14, "copper_block");

g.save(`${HERE}/DC86819.nbt`);
console.log(`DC86819: ${g.count()} blocks, palette ${g.palette.length}, size ${g.size.join("x")}`);
