import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Way 269467616, Eden Terrace side of Mt Eden. Read as an interwar brick shop-top: red brick walls on a black basalt
// plinth, cream smooth-stone quoins, storey bands, a cornice and parapet, a flat roof with a stair penthouse, air-con
// units and a skylight, and a shopfront with a door on the street (south) face. The uphill (north-west) cells stand on
// one block of ground, so their roof is one storey; the downhill side shows two.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_269467616.cells.json`, "utf8"));
const W = 20, D = 13;

const fp = new Map(cells.map(([x, z, g, r]) => [`${x},${z}`, { g, r }]));
const key = (x, z) => `${x},${z}`;
const has = (x, z) => fp.has(key(x, z));
// the sides of a cell that face outside the footprint
const openFaces = (x, z) => [["N", !has(x, z - 1)], ["S", !has(x, z + 1)], ["W", !has(x - 1, z)], ["E", !has(x + 1, z)]]
  .filter(([, open]) => open).map(([f]) => f);
const isWall = (x, z) => openFaces(x, z).length > 0;
const inward = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };
const rows = (lo, hi) => Array.from({ length: Math.max(0, hi - lo + 1) }, (_, i) => lo + i);

// Roof: the lidar's roof height, median-smoothed over 3 x 3 cells into flat tiers of 5 to 7 blocks above y 0, and never
// less than five blocks above the cell's own ground.
const roof = new Map();
for (const [k, { g }] of fp) {
  const [x, z] = k.split(",").map(Number), near = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const c = fp.get(key(x + dx, z + dz)); if (c) near.push(c.r); }
  near.sort((a, b) => a - b);
  const med = near[Math.floor(near.length / 2)];
  roof.set(k, Math.max(g + 5, Math.min(7, Math.max(5, med))));
}

// The storey lines of a cell: two storeys where the roof stands seven or more blocks above its ground, else one.
// glass = window rows, band = stone storey line, ground = the shopfront rows on the street face.
function storeys(g, T) {
  if (T - g >= 7) return { two: true, glass: [...rows(g + 1, g + 2), ...rows(g + 4, T - 2)], band: [g + 3], ground: rows(g + 1, g + 2) };
  return { two: false, glass: rows(g + 1, T - 3), band: [T - 2], ground: rows(g + 1, T - 3) };
}

// The door: the street-face cell nearest the middle of the shopfront that is not a pier.
const streetCells = [...fp.keys()].map((k) => k.split(",").map(Number))
  .filter(([x, z]) => !has(x, z + 1) && has(x - 1, z) && has(x + 1, z) && x % 3 !== 0);
const mid = streetCells.reduce((s, [x]) => s + x, 0) / streetCells.length;
const [doorX, doorZ] = streetCells.reduce((best, c) => (Math.abs(c[0] - mid) < Math.abs(best[0] - mid) ? c : best));

const Y = Math.max(...roof.values()) + 4;
const vox = new Voxels([W, Y, D]);
const put = (x, y, z, block, state) => vox.set(x, y, z, block, state);

for (const [k, { g }] of fp) {
  const [x, z] = k.split(",").map(Number), T = roof.get(k);
  const S = storeys(g, T);

  for (let y = 0; y < g; y++) put(x, y, z, "polished_basalt");          // foundation: solid from y 0 up to the ground

  if (!isWall(x, z)) {                                                  // inside: air, with a floor per storey and the roof deck
    put(x, g, z, "smooth_stone");
    if (S.two) put(x, g + 3, z, "oak_planks");
    put(x, T - 1, z, "gray_concrete");
    continue;
  }

  const faces = openFaces(x, z), corner = faces.length > 1, f = faces[0];
  const p = f === "N" || f === "S" ? x : z;                           // position along the face: piers every third cell
  const door = x === doorX && z === doorZ;
  const street = f === "S" && !corner;

  put(x, g, z, "polished_basalt");                                     // base course
  for (let y = g + 1; y <= T; y++) {
    if (y === T) { put(x, y, z, corner ? "smooth_quartz" : "smooth_quartz_slab", corner ? undefined : { type: "bottom" }); continue; }
    if (door && y === g + 3) { put(x, y, z, "dark_oak_slab", { type: "bottom" }); continue; }
    if (door && (y === g + 1 || y === g + 2)) {
      put(x, y, z, "oak_door", { facing: "south", half: y === g + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (corner || S.band.includes(y)) { put(x, y, z, "smooth_quartz"); continue; }
    if (y === T - 1) { put(x, y, z, "bricks"); continue; }                 // brick corbel course under the cream parapet cap
    if (!S.glass.includes(y)) { put(x, y, z, "bricks"); continue; }
    const shop = street && S.ground.includes(y);
    if (p % 3 === 0) { put(x, y, z, shop ? "smooth_quartz" : "bricks"); continue; }
    if (shop) put(x, y, z, "glass");
    else if (f === "N" || f === "S") put(x, y, z, "glass_pane", { east: "true", west: "true", north: "false", south: "false" });
    else put(x, y, z, "glass_pane", { north: "true", south: "true", east: "false", west: "false" });
  }

  // a warm light in the room behind some windows, standing on the floor under it
  if (!corner && !door && p % 3 !== 0) {
    const [dx, dz] = inward[f], ix = x + dx, iz = z + dz;
    if (has(ix, iz) && !isWall(ix, iz)) {
      if (p % 6 === 2 && S.ground.includes(g + 1)) put(ix, g + 1, iz, "lantern", { hanging: "false" });
      if (S.two && p % 6 === 5) put(ix, g + 4, iz, "glowstone");
      if (S.two && p % 6 === 2) put(ix, g + 4, iz, "shroomlight");
    }
  }
}

// Roof: a 3 x 2 stair penthouse over the middle of the building, two air-con units, and a skylight beside the penthouse.
const interior = (x, z) => has(x, z) && !isWall(x, z);
let pent = null;
for (let x0 = 0; x0 <= W - 3; x0++) for (let z0 = 0; z0 <= D - 2; z0++) {
  const T = roof.get(key(x0, z0)), block = [];
  for (let dz = 0; dz < 2; dz++) for (let dx = 0; dx < 3; dx++) block.push([x0 + dx, z0 + dz]);
  if (!block.every(([x, z]) => interior(x, z) && roof.get(key(x, z)) === T)) continue;
  const d = Math.abs(x0 + 1 - (W - 1) / 2) + Math.abs(z0 + 0.5 - (D - 1) / 2);
  if (!pent || d < pent.d) pent = { x0, z0, T, d };
}
if (pent) {
  for (let dz = 0; dz < 2; dz++) for (let dx = 0; dx < 3; dx++) {
    const x = pent.x0 + dx, z = pent.z0 + dz;
    put(x, pent.T, z, "bricks"); put(x, pent.T + 1, z, "bricks");
    put(x, pent.T + 2, z, "smooth_quartz_slab", { type: "bottom" });
  }
  for (const z of [pent.z0, pent.z0 + 1]) {
    const x = pent.x0 + 4;
    if (interior(x, z) && roof.get(key(x, z)) === pent.T) put(x, pent.T - 1, z, "glass");
  }
  const units = [...fp.keys()].map((k) => k.split(",").map(Number))
    .filter(([x, z]) => interior(x, z) && roof.get(key(x, z)) === pent.T && Math.abs(x - pent.x0) > 1)
    .sort((a, b) => Math.hypot(b[0] - pent.x0, b[1] - pent.z0) - Math.hypot(a[0] - pent.x0, a[1] - pent.z0));
  const picked = [];
  for (const u of units) if (picked.every((q) => Math.hypot(q[0] - u[0], q[1] - u[1]) >= 4)) picked.push(u);
  for (const [x, z] of picked.slice(0, 2)) put(x, pent.T, z, "iron_block");
}

const counts = vox.save(`${DIR}/way_269467616.nbt`);
console.log(JSON.stringify({ size: [W, Y, D], door: [doorX, doorZ], penthouse: pent, ...counts }));
