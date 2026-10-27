// A 1930s reinforced-concrete shop-and-office block, the CBD's inter-war type: a basalt plinth, a white-concrete
// facade with smooth-quartz string courses, steel-sash glazing in piered bays, shopfronts at street level, a
// recessed entrance on the street side, a stepped tower at the east end and a flat roof with plant.
// The lidar roof heights are quantised to whole 4-block storeys; the walls are a one-block shell over hollow
// interiors with a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_250462349.cells.json`, "utf8"));   // [x, z, ground, roof]
const SIZE = [43, 48, 26];

const key = (x, z) => `${x},${z}`;
const T = new Map(), G = new Map();                    // "x,z" -> top (exclusive y) and ground y
for (const [x, z, g, r] of cells) {
  const top = r < 4 ? 0 : 4 * Math.floor((r + 1) / 4);  // lidar roof -> whole storeys (4 blocks); noise under 4 is no building
  if (top) { T.set(key(x, z), top); G.set(key(x, z), g); }
}
const Tof = (x, z) => T.get(key(x, z)) ?? 0;
const Gof = (x, z) => G.get(key(x, z)) ?? 0;
const SIDES = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const DIRS = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];

const inM = (x, y, z) => { const t = Tof(x, z); return t > 0 && y >= Gof(x, z) && y < t; };
const shell = (x, y, z) => DIRS.some(([dx, dy, dz]) => !inM(x + dx, y + dy, z + dz));   // touches the outside
const sideFaces = (x, y, z) => SIDES.filter(([dx, dz]) => !inM(x + dx, y, z + dz));

const B = new Map();                                    // "x,y,z" -> { x, y, z, block, state }
const put = (x, y, z, block, state) => B.set(`${x},${y},${z}`, { x, y, z, block, state });
const SOLID = new Set(["white_concrete", "light_gray_concrete", "smooth_quartz", "polished_andesite", "cobblestone",
  "gray_concrete", "smooth_stone", "glass_pane", "iron_block"]);
const glazed = [];

for (const [k, t] of T) {
  const [x, z] = k.split(",").map(Number), g = Gof(x, z);
  for (let y = 0; y < g; y++) put(x, y, z, "cobblestone");          // foundation: solid from y 0 up to the ground
  for (let y = g; y < t; y++) {
    if (!shell(x, y, z)) { if (y % 4 === 0) put(x, y, z, "smooth_stone"); continue; }   // hollow, a slab per storey
    const faces = sideFaces(x, y, z);
    if (y === g) put(x, y, z, "polished_andesite");                    // basalt plinth course
    else if (y === t - 1) put(x, y, z, faces.length ? "smooth_quartz" : "gray_concrete");   // coping, roof deck
    else if (!faces.length) put(x, y, z, "white_concrete");
    else {
      const [nx, nz] = faces[0];
      const corner = faces.some(([dx]) => dx) && faces.some(([, dz]) => dz);
      const p = y % 4;
      if (corner || p === 0) put(x, y, z, "smooth_quartz");           // quoins, string courses
      else if (p === 3) put(x, y, z, y < 4 ? "smooth_quartz" : "light_gray_concrete");   // fascia, spandrel
      else if ((nx ? z : x) % 3 === 0) put(x, y, z, "white_concrete"); // pier between the bays
      else { put(x, y, z, "glass_pane"); if (p === 1) glazed.push({ x, y, z, nx, nz }); }
    }
  }
}

// the entrance: a recessed door in the street (+z) front, at the middle of that front's run
const front = [];
for (const [k] of T) {
  const [x, z] = k.split(",").map(Number), g = Gof(x, z);
  if (sideFaces(x, g, z).some(([, dz]) => dz === 1)) front.push([x, z, g]);
}
const maxZ = Math.max(...front.map(([, z]) => z));
const run = front.filter(([, z]) => z === maxZ);
const midX = run.reduce((s, [x]) => s + x, 0) / run.length;
const [dx0, dz0, dg] = run.reduce((a, b) => (Math.abs(b[0] - midX) < Math.abs(a[0] - midX) ? b : a));
const door = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
put(dx0, dg, dz0, "dark_oak_door", door("lower"));
put(dx0, dg + 1, dz0, "dark_oak_door", door("upper"));

// warm light: glowstone on the floor just inside a few upper-storey windows (the pane sits on the slab below)
for (const { x, y, z, nx, nz } of glazed) {
  if (B.get(`${x},${y},${z}`)?.block !== "glass_pane" || (x * 7 + z * 5 + y) % 9 !== 0) continue;
  const bx = x - nx, bz = z - nz;
  if (inM(bx, y, bz) && !shell(bx, y, bz) && !B.has(`${bx},${y},${bz}`)) put(bx, y, bz, "glowstone");
}

// roof terraces: plant boxes with a lantern on some, set on the roof deck well inside the parapet
for (const [k, t] of T) {
  const [x, z] = k.split(",").map(Number);
  const deckInside = SIDES.every(([dx, dz]) => Tof(x + dx, z + dz) >= t);
  if (!deckInside || (x * 3 + z * 5 + t) % 23 !== 0) continue;
  put(x, t, z, "iron_block");
  put(x, t + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
}

// glass panes connect to their neighbours in the wall, as a placed pane does
const yes = (b) => (b ? "true" : "false");
for (const e of B.values()) {
  if (e.block !== "glass_pane") continue;
  const on = (dx, dz) => SOLID.has(B.get(`${e.x + dx},${e.y},${e.z + dz}`)?.block);
  e.state = { east: yes(on(1, 0)), west: yes(on(-1, 0)), north: yes(on(0, -1)), south: yes(on(0, 1)) };
}

const out = new Voxels(SIZE);
for (const e of B.values()) out.set(e.x, e.y, e.z, e.block, e.state);
const res = out.save(`${DIR}/way_250462349.nbt`);
const tops = [...new Set([...T.values()])].sort((a, b) => a - b);
console.log(`built ${res.blocks} blocks, palette ${res.palette}; tiers at y ${tops.join(", ")}; entrance at ${dx0},${dg},${dz0}`);
