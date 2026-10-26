// 1250 Connecticut Ave NW, Dupont Circle: a 1960s-70s precast-and-tinted-glass commercial office, 4 storeys of 3 blocks on
// a podium with a 5-storey central crown. Storey lines every 3 blocks; the lidar roof is smoothed into flat tiers (3, 12,
// 14, 15); the crown and podium are set on a solid floor per storey so nothing hangs. Facade = piers + glass + spandrels.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC56926.cells.json", "utf8"));
const X = 24, Z = 26;
const raw = new Map(), ground = new Map();
for (const [x, z, g, r] of cells) { raw.set(`${x},${z}`, r); ground.set(`${x},${z}`, g); }
const inFoot = (x, z) => raw.has(`${x},${z}`);

// lidar noise -> flat tiers: the 3x3 mean of the footprint's raw roofs picks the tier; the west wing stays a one-storey low wing
const roof = new Map();
for (const [x, z] of [...raw.keys()].map((k) => k.split(",").map(Number))) {
  const r0 = raw.get(`${x},${z}`);
  if (r0 <= 3) { roof.set(`${x},${z}`, 3); continue; }
  let s = 0, n = 0;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inFoot(x + dx, z + dz)) { s += raw.get(`${x + dx},${z + dz}`); n++; }
  const m = s / n;
  roof.set(`${x},${z}`, m < 13 ? 12 : m < 14.5 ? 14 : 15);
}
const R = (x, z) => (roof.has(`${x},${z}`) ? roof.get(`${x},${z}`) : -1);
const G = (x, z) => ground.get(`${x},${z}`) ?? 0;
const occupied = (x, z, y) => R(x, z) > y;                 // a column is solid from its ground to its roof

// the four faces: outward direction, and the along-face axis that sets the pier rhythm
const FACES = [{ dx: 0, dz: -1, along: "x" }, { dx: 0, dz: 1, along: "x" }, { dx: -1, dz: 0, along: "z" }, { dx: 1, dz: 0, along: "z" }];

const g = new Voxels([X, 27, Z]);
const fill = new Set();            // cells taken by the entrance, lanterns and roof plant (so the pass below skips them)
const put = (x, y, z, block, state) => { g.set(x, y, z, block, state); fill.add(`${x},${y},${z}`); };

for (const [key, r] of roof) {
  const [x, z] = key.split(",").map(Number);
  const gr = G(x, z);
  for (let y = 0; y < gr; y++) g.set(x, y, z, "polished_andesite");   // foundation from the lowest ground
  for (let y = gr; y < r; y++) {
    if (fill.has(`${x},${y},${z}`)) continue;
    const exposed = FACES.filter((f) => !occupied(x + f.dx, z + f.dz, y));
    if (y === r - 1) { g.set(x, y, z, exposed.length ? "smooth_quartz" : "stone"); continue; }   // parapet / roof membrane
    if (!exposed.length) {                                                                         // interior: floor slab per storey, air between
      if (y % 3 === 0) g.set(x, y, z, "smooth_quartz");
      continue;
    }
    const corner = exposed.length > 1;
    const f = exposed[0];
    const along = f.along === "x" ? x : z;
    const pier = corner || along % 3 === 0;
    if (y === 0) { g.set(x, y, z, "polished_andesite"); continue; }                                // base course
    if (y < 3) { g.set(x, y, z, pier ? "polished_andesite" : "light_blue_stained_glass"); continue; }  // shopfront
    if (y % 3 === 0) { g.set(x, y, z, "light_gray_concrete"); continue; }                         // spandrel = storey line
    if (pier) { g.set(x, y, z, "white_concrete"); continue; }
    g.set(x, y, z, "light_blue_stained_glass");
    // warm light in a few windows: a glowstone or shroomlight in the air behind the glass
    const ix = x - f.dx, iz = z - f.dz;
    if (inFoot(ix, iz) && occupied(ix, iz, y) && !fill.has(`${ix},${y},${iz}`) && (x * 7 + z * 13 + y * 5) % 17 === 0) {
      g.set(ix, y, iz, (x + y) % 2 ? "glowstone" : "shroomlight");
    }
  }
}

// the entrance: a double door in the north front, a black canopy over it, hanging lanterns under the canopy
const doorY = [1, 2];
for (const x of [7, 8]) {
  for (const y of doorY) {
    const hinge = x === 7 ? "left" : "right";
    put(x, y, 0, "dark_oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge, open: "false", powered: "false" });
  }
}
for (let x = 6; x <= 9; x++) put(x, 3, 0, "stone_bricks");
for (const x of [6, 9]) put(x, 2, 0, "lantern", { hanging: "true", waterlogged: "false" });

// roof plant: two light-grey mechanical boxes on podium roof (2x2, 2 high), away from each other
const plant = [];
for (let z = 1; z < Z - 2 && plant.length < 2; z++) for (let x = 1; x < X - 2 && plant.length < 2; x++) {
  const ok = [0, 1].every((dx) => [0, 1].every((dz) => R(x + dx, z + dz) === 12));
  const ring = [-1, 0, 1, 2].every((dx) => [-1, 0, 1, 2].every((dz) => R(x + dx, z + dz) >= 12));
  if (ok && ring && plant.every((p) => Math.abs(p[0] - x) > 4 || Math.abs(p[1] - z) > 4)) plant.push([x, z]);
}
for (const [x, z] of plant) for (const y of [12, 13]) for (const dx of [0, 1]) for (const dz of [0, 1]) put(x + dx, y, z + dz, "light_gray_concrete");

const res = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC56926.nbt");
console.log("saved", res);
