// Auckland, footprint way 343886713: a four-storey interwar commercial block (brick, cream quartz piers and string
// courses, granite base, steel-framed windows), set on a slope: the north side grades to y 0, the south-west to y 4.
// Storey lines are absolute (y 0, 4, 8, 12), so the uphill side is buried foundation and the downhill side shows
// all four storeys. Lidar roof is 16-17 everywhere, so the roof is one flat deck with crowned piers, not setbacks.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_343886713.cells.json", "utf8"));

const DIR = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
const key = (x, z) => `${x},${z}`;
const F = new Map(cells.map(([x, z, ground, roof]) => [key(x, z), { x, z, ground, roof }]));
const has = (x, z) => F.has(key(x, z));
for (const c of F.values()) {
  c.out = Object.keys(DIR).filter((d) => !has(c.x + DIR[d][0], c.z + DIR[d][1]));   // faces that look outside the footprint
  c.perim = c.out.length > 0;
}

const DECK = 15, TOP = 16;                                       // roof deck layer y 15 (top surface 16); crowned piers to 17
const v = new Voxels([34, 30, 40]);

// the entrance: a west-facing ground-level cell on the lowest edge, between two piers
const DOOR = { x: 9, z: 2, face: "west" };
const doorCell = F.get(key(DOOR.x, DOOR.z));
if (!doorCell || !doorCell.perim || !doorCell.out.includes(DOOR.face) || doorCell.ground !== 0) throw new Error("door cell moved");

// 1. foundation under each cell, from y 0 up to its ground; interior floor slabs at storey lines, roof deck over all
for (const c of F.values()) {
  for (let y = 0; y < c.ground; y++) v.set(c.x, y, c.z, "stone_bricks");
  if (c.perim) continue;
  for (const y of [0, 4, 8, 12]) if (y >= c.ground) v.set(c.x, y, c.z, "smooth_stone");
  v.set(c.x, DECK, c.z, "gray_concrete");
}

// 2. perimeter walls: granite base, bricks with cream quartz piers every 4 cells, quartz string courses and cornice,
//    steel-framed glass with iron mullions, and the entrance
let windows = 0, lights = 0;
for (const c of F.values()) {
  if (!c.perim) continue;
  // the face is the first outward one; on the stepped diagonal a cell can have two, so piers follow the bay grid, not corners
  const face = c.out[0];
  const alongZ = face === "east" || face === "west";
  const u = alongZ ? c.z : c.x;
  const doorFlank = face === DOOR.face && Math.abs(u - (alongZ ? DOOR.z : DOOR.x)) <= 1;   // the piers either side of the door
  const pier = u % 4 === 0 || doorFlank;
  const axisPanes = alongZ ? { north: "true", south: "true", east: "false", west: "false" } : { north: "false", south: "false", east: "true", west: "true" };
  for (let y = c.ground; y <= TOP; y++) {
    if (c.x === DOOR.x && c.z === DOOR.z && y <= 2) continue;     // the door itself is set below
    if (pier) { v.set(c.x, y, c.z, "smooth_quartz"); continue; }
    if (y === c.ground) { v.set(c.x, y, c.z, "polished_granite"); continue; }
    if (y === TOP) continue;                                       // crowning piers only
    if (y === DECK || y % 4 === 0) { v.set(c.x, y, c.z, "smooth_quartz"); continue; }
    if (y % 4 === 3) { v.set(c.x, y, c.z, "bricks"); continue; }
    // window rows: a glass pane each cell, an iron mullion on every third cell
    if (u % 4 === 2) v.set(c.x, y, c.z, "iron_bars", axisPanes);
    else { v.set(c.x, y, c.z, "glass_pane", axisPanes); windows++; }
  }
}

// the entrance: door (lower and upper half) under a granite lintel, between the quartz piers on its wall
v.set(DOOR.x, 0, DOOR.z, "polished_granite");
v.set(DOOR.x, 1, DOOR.z, "dark_oak_door", { facing: "west", half: "lower", hinge: "left", open: "false", powered: "false" });
v.set(DOOR.x, 2, DOOR.z, "dark_oak_door", { facing: "west", half: "upper", hinge: "left", open: "false", powered: "false" });
for (const dz of [-1, 0, 1]) v.set(DOOR.x, 3, DOOR.z + dz, "polished_granite");

// 3. warm light behind some lower-row windows: a lantern or glowstone on the floor just inside the glass (air gap behind it)
for (const c of F.values()) {
  if (!c.perim) continue;
  for (const face of c.out) {
    for (let y = c.ground + 1; y < TOP; y++) {
      if (y % 4 !== 1 || !v.get(c.x, y, c.z)?.block.endsWith("glass_pane")) continue;   // lower glass row only
      if (((c.x * 5 + c.z * 3 + y) % 7) !== 0) continue;
      const ix = c.x - DIR[face][0], iz = c.z - DIR[face][1];
      if (!has(ix, iz) || F.get(key(ix, iz)).perim) continue;
      if (v.get(ix, y, iz)) continue;
      if ((ix + iz) % 2 === 0) v.set(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
      else v.set(ix, y, iz, "glowstone");
      lights++;
    }
  }
}

// 4. roof plant: two 4 x 3 boxes set in from the parapet, on the deck
const dist = new Map(), q = [];
for (const c of F.values()) if (c.perim) { dist.set(key(c.x, c.z), 0); q.push(c); }
for (let i = 0; i < q.length; i++) {
  const c = q[i], d = dist.get(key(c.x, c.z));
  for (const [dx, dz] of Object.values(DIR)) {
    const k = key(c.x + dx, c.z + dz);
    if (F.has(k) && !dist.has(k)) { dist.set(k, d + 1); q.push(F.get(k)); }
  }
}
const boxAt = (x0, z0) => {
  const out = [];
  for (let dx = 0; dx < 4; dx++) for (let dz = 0; dz < 3; dz++) {
    const k = key(x0 + dx, z0 + dz);
    if (!F.has(k) || dist.get(k) < 3) return null;
    out.push([x0 + dx, z0 + dz]);
  }
  return out;
};
let boxes = [];
for (let pass = 0; pass < 2; pass++) {
  let best = null, bestScore = -1;
  for (let x0 = 0; x0 < 31; x0++) for (let z0 = 0; z0 < 38; z0++) {
    const cellsInBox = boxAt(x0, z0);
    if (!cellsInBox) continue;
    if (boxes.some(([bx, bz]) => Math.abs(bx - x0) + Math.abs(bz - z0) < 9)) continue;
    const score = cellsInBox.reduce((s, [x, z]) => s + dist.get(key(x, z)), 0);
    if (score > bestScore) { bestScore = score; best = [x0, z0]; }
  }
  if (best) boxes.push(best);
}
for (const [x0, z0] of boxes) for (let dx = 0; dx < 4; dx++) for (let dz = 0; dz < 3; dz++) {
  v.set(x0 + dx, TOP, z0 + dz, "stone_bricks");
  v.set(x0 + dx, TOP + 1, z0 + dz, "stone_bricks");
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_343886713.nbt";
const info = v.save(out);
console.log(JSON.stringify({ cells: F.size, windows, lights, roofBoxes: boxes.length, ...info }));
