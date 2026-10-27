// Auckland Sunday School Union Building (way 293020905): a 1930s brick-and-plaster block in the stripped-Classical
// manner. Six storeys on the high ground to the south-east, lower wings where the lidar drops to 16-23 blocks, a
// quartz cornice line and coping at 26, and a small solid plant room on the roof. Storey lines run level across the
// whole block (every 4 blocks from the ground floor at y 10), so the downhill side gets basement storeys below them;
// the walls are one brick thick with an air gap behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_293020905.cells.json`, "utf8"));

const FOUND = "stone_bricks", BASE = "polished_andesite", BRICK = "bricks", PLASTER = "smooth_quartz";
const FLOOR = "smooth_stone", ROOF = "stone", GLASS = "light_blue_stained_glass_pane";
const GLASS_ID = `minecraft:${GLASS}`;
const LINE0 = 10;                                   // the ground-floor line: the uphill ground, so the entrance is at street level
const mod4 = (n) => ((n % 4) + 4) % 4;

const DIRS = [
  { name: "north", dx: 0, dz: -1 }, { name: "east", dx: 1, dz: 0 },
  { name: "south", dx: 0, dz: 1 }, { name: "west", dx: -1, dz: 0 },
];

// lidar roof -> one flat tier per band: 24-26 is the six-storey body, 20-23 and 16-19 are lower wings; the three
// stray 1s are lidar nodata and fall into the lowest wing
const tierTop = (roof) => (roof >= 24 ? 26 : roof >= 20 ? 20 : 16);

const C = new Map();
for (const [x, z, ground, roof] of cells) C.set(`${x},${z}`, { x, z, g: ground, T: tierTop(roof) });
const cell = (x, z) => C.get(`${x},${z}`);
const faces = (c) => DIRS.filter((d) => !cell(c.x + d.dx, c.z + d.dz));                             // onto open air
const steps = (c) => DIRS.filter((d) => { const n = cell(c.x + d.dx, c.z + d.dz); return n && n.T < c.T; }); // onto a lower wing
const alongU = (c, d) => (d.dx ? c.z : c.x);       // position along the wall: the bay index is this mod 4

const vox = new Voxels([39, 39, 29]);
const glass = [];
for (const c of C.values()) {
  const { x, z, g: gr, T } = c;
  const out = faces(c), lower = steps(c);
  for (let y = 0; y < gr; y++) vox.set(x, y, z, FOUND, null);                       // fill up to this cell's ground
  for (let y = gr; y < T; y++) {
    const r = mod4(y - LINE0), s = Math.floor((y - LINE0) / 4);                      // row within the storey, storey index
    const ring = out.length > 0 || lower.some((d) => cell(x + d.dx, z + d.dz).T <= y);
    if (!ring) {                                                                      // interior: a floor on the ground and at each line, air between
      if (y === T - 1) vox.set(x, y, z, ROOF, null);
      else if (r === 0 || y === gr) vox.set(x, y, z, FLOOR, null);
      continue;
    }
    if (y === T - 1) { vox.set(x, y, z, PLASTER, null); continue; }                  // coping
    if (y === gr) { vox.set(x, y, z, BASE, null); continue; }                        // base course on the ground
    if (r === 0) { vox.set(x, y, z, s === 0 ? BASE : PLASTER, null); continue; }      // ground-floor plinth, string courses
    const face = out.length === 1 ? out[0] : out.length === 0 && lower.length === 1 ? lower[0] : null; // a body wall above a wing reads as a window face too
    if (!face || alongU(c, face) % 4 === 0) { vox.set(x, y, z, BRICK, null); continue; } // piers and corners
    if (s === 0 || r !== 3) { vox.set(x, y, z, GLASS, null); glass.push({ x, y, z, d: face, u: alongU(c, face), s, r }); }
    else vox.set(x, y, z, PLASTER, null);                                              // window head
  }
}

// entrance: a door in the middle bay of the main body at the ground-floor line (the uphill side), its lintel above,
// a lantern just inside
const mainBays = [...C.values()].filter((c) => c.T === 26 && faces(c).length === 1 && alongU(c, faces(c)[0]) % 4 !== 0);
const nearest = Math.min(...mainBays.map((c) => Math.abs(c.g - LINE0)));
const atLine = mainBays.filter((c) => Math.abs(c.g - LINE0) === nearest).sort((a, b) => alongU(a, faces(a)[0]) - alongU(b, faces(b)[0]));
const door = atLine[Math.floor(atLine.length / 2)];
const doorFace = faces(door)[0];
const doorState = (half) => ({ facing: doorFace.name, half, hinge: "left", open: "false", powered: "false" });
vox.set(door.x, door.g + 1, door.z, "dark_oak_door", doorState("lower"));
vox.set(door.x, door.g + 2, door.z, "dark_oak_door", doorState("upper"));
vox.set(door.x, door.g + 3, door.z, PLASTER, null);
vox.set(door.x - doorFace.dx, door.g + 3, door.z - doorFace.dz, "lantern", { hanging: "true", waterlogged: "false" });

// warm light behind some glass: glowstone in the shopfronts, shroomlight and standing lanterns upstairs and below;
// only where the block under is solid, so nothing floats
for (const p of glass) {
  if (vox.get(p.x, p.y, p.z)?.block !== GLASS_ID) continue;                       // skip the door's cells
  const ix = p.x - p.d.dx, iz = p.z - p.d.dz;
  if (vox.get(ix, p.y, iz) !== null || vox.get(ix, p.y - 1, iz) === null) continue;
  if (p.s === 0 && p.r === 1 && p.u % 3 === 0) vox.set(ix, p.y, iz, "glowstone", null);
  else if (p.s !== 0 && p.r === 1 && (p.u + p.s) % 5 === 0) vox.set(ix, p.y, iz, "shroomlight", null);
  else if (p.s !== 0 && p.r === 1 && (p.u + p.s) % 5 === 2) vox.set(ix, p.y, iz, "lantern", { hanging: "false", waterlogged: "false" });
}

// the glass panes connect to any solid neighbour in their wall line (east/west on a north or south face, and so on)
for (const p of glass) {
  if (vox.get(p.x, p.y, p.z)?.block !== GLASS_ID) continue;
  const on = (dx, dz) => (vox.get(p.x + dx, p.y, p.z + dz) !== null ? "true" : "false");
  vox.set(p.x, p.y, p.z, GLASS, { north: on(0, -1), east: on(1, 0), south: on(0, 1), west: on(-1, 0), waterlogged: "false" });
}

// roof plant room: a solid brick block with a stone cap, set in from the parapet on the main roof
const ring2 = (c, k) => { for (let dx = -k; dx <= k; dx++) for (let dz = -k; dz <= k; dz++) { const n = cell(c.x + dx, c.z + dz); if (!n || n.T !== 26) return false; } return true; };
const all = [...C.values()];
const cx = all.reduce((a, c) => a + c.x, 0) / all.length, cz = all.reduce((a, c) => a + c.z, 0) / all.length;
const near = (c) => Math.hypot(c.x - cx, c.z - cz);
const k = 2, centre = all.filter((c) => c.T === 26 && ring2(c, k)).sort((a, b) => near(a) - near(b))[0];
if (centre) {
  for (let dx = -k; dx <= k; dx++) for (let dz = -k; dz <= k; dz++) {
    const x = centre.x + dx, z = centre.z + dz;
    vox.set(x, 26, z, BASE, null);
    vox.set(x, 27, z, BRICK, null);
    vox.set(x, 28, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

const stats = vox.save(`${DIR}/way_293020905.nbt`);
console.log(JSON.stringify({ cells: cells.length, glass: glass.length, door: [door.x, door.z, door.g], plant: centre ? [centre.x, centre.z] : null, ...stats }));
