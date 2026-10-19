// 3550 West Pacific Av (Miscellaneous / Mixed-Use), Presidio Tunnel Tops.
// Read from the record: roof about 8 blocks (16 m) above its lowest ground, so four storeys of 2 blocks. Built as a
// 1920s commercial block: cream smooth-sandstone walls on a stone-brick plinth, quartz belt courses at each floor line,
// sash-style glass panes between sandstone piers, a dark-oak shopfront with a red awning and a door on the street
// facade, a quartz cornice, and a flat gray roof with two HVAC boxes. Glowstone sits behind some windows.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/sf/presidio-tunnel-tops/fill";
const cells = JSON.parse(readFileSync(`${DIR}/201006.0002257.cells.json`, "utf8"));   // [x, z, ground]

const SIZE = [26, 20, 30];
const WALL = "smooth_sandstone";
const BELT = "smooth_quartz";        // floor lines, door lintels, cornice
const BASE = "stone_bricks";         // plinth and foundation
const SHOP = "dark_oak_planks";      // shopfront piers
const GLASS = "glass_pane";
const CANOPY = "red_terracotta";     // entrance awning
const ROOF = "smooth_stone";         // flat roof membrane, light enough to read as a roof from above
const HVAC = "light_gray_concrete";  // roof equipment
const GLOW = "glowstone";
const TOP = 8;                       // cornice row; walls run y 0..7 above their ground
const LIT = [1, 3, 5, 7];            // window rows (storeys), the even rows between them are floor lines

const key = (x, z) => `${x},${z}`;
const ground = new Map(cells.map(([x, z, g]) => [key(x, z), g]));
const inside = (x, z) => ground.has(key(x, z));
const NORMALS = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const DIRS = { "-1,0": "west", "1,0": "east", "0,-1": "north", "0,1": "south" };
const faces = (x, z) => NORMALS.filter(([dx, dz]) => !inside(x + dx, z + dz));
const shell = (x, z) => inside(x, z) && faces(x, z).length > 0;

// Facade of a shell cell: its outward normal, whether it is a corner (two faces), whether it faces the street
// (west or south: shopfronts there), and its position along that facade.
function facade(x, z) {
  const fs = faces(x, z);
  const n = fs.find(([nx, nz]) => nx === -1 || nz === 1) ?? fs[0];
  return { n, corner: fs.length > 1, commercial: n[0] === -1 || n[1] === 1, along: n[0] !== 0 ? z : x };
}

// Glass is only where a room sits behind it: the cell inward of the pane must be interior, not another wall.
const behind = (x, z, n) => [x - n[0], z - n[1]];
const windowable = (x, z, n) => { const [bx, bz] = behind(x, z, n); return inside(bx, bz) && !shell(bx, bz); };

// Entrances: the footprint is a diagonal blob whose faces are stair steps one or two cells long, so a 3-cell bay
// rarely exists. Two door bays go where the most wall of one facade lies within 3 blocks, 8 apart at least.
const facadeAt = new Map();   // "nx,nz:along" -> [x, z], corners left out
for (const [x, z] of cells) {
  if (!shell(x, z)) continue;
  const f = facade(x, z);
  if (!f.corner) facadeAt.set(`${f.n}:${f.along}`, [x, z]);
}
const scored = [...facadeAt.keys()].map((k) => {
  const i = k.lastIndexOf(":"), n = k.slice(0, i), a = Number(k.slice(i + 1));
  let s = 0; for (let d = -3; d <= 3; d++) if (facadeAt.has(`${n}:${a + d}`)) s++;
  return { k, n, a, s };
}).sort((p, q) => q.s - p.s);
const bayCenters = new Set();
const picked = [];
for (const c of scored) {
  if (picked.length === 2) break;
  if (picked.every((p) => p.n !== c.n || Math.abs(p.a - c.a) >= 8)) picked.push(c);
}
for (const c of picked) bayCenters.add(c.k);
// Which part of a bay a facade cell is: "center" (door), "edge" (lantern and glass beside it), or null.
function bayPart(n, along) {
  if (bayCenters.has(`${n}:${along}`)) return "center";
  for (const d of [-1, 1]) if (bayCenters.has(`${n}:${along - d}`)) return "edge";
  return null;
}

// Warm light behind some windows: a glowstone in the room cell inward of the pane, on a fixed pattern.
const lit = new Set();
for (const [x, z] of cells) {
  if (!shell(x, z)) continue;
  const f = facade(x, z);
  if (f.corner || f.along % 3 === 0 || !windowable(x, z, f.n)) continue;
  for (const y of LIT) {
    if ((x * 31 + z * 17 + y * 7) % 9 !== 0) continue;
    const [bx, bz] = behind(x, z, f.n);
    lit.add(`${bx},${y},${bz}`);
  }
}

const doorState = (f, half) => ({ facing: DIRS[`${f.n[0]},${f.n[1]}`], half, hinge: "left", open: "false", powered: "false" });
const paneState = (n) => (n[0] !== 0
  ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
  : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });

// What sits in a shell cell at height y: plinth, floor lines, cornice, door bay, awning, windows or piers.
function facadeBlock(x, z, y) {
  const f = facade(x, z);
  const part = f.corner ? null : bayPart(f.n, f.along);
  if (y === 0) return { block: BASE };
  if (y === TOP) return { block: BELT };
  if (part === "center" && y === 1) return { block: "dark_oak_door", state: doorState(f, "lower") };
  if (part === "center" && y === 2) return { block: "dark_oak_door", state: doorState(f, "upper") };
  if (part === "edge" && y === 2) return { block: "lantern", state: { hanging: "true", waterlogged: "false" } };
  if (part && y === 3) return { block: CANOPY };
  if (y % 2 === 0) return { block: BELT };
  const pier = f.corner || f.along % 3 === 0;
  if (!pier && windowable(x, z, f.n)) return { block: GLASS, state: paneState(f.n) };
  if (f.commercial && y === 1) return { block: SHOP };
  return { block: WALL };
}

const g = new Voxels(SIZE);
const counts = { walls: 0, glass: 0, doors: 0, lamps: 0, hvac: 0 };
const put = (x, y, z, b) => { if (!b) return; g.set(x, y, z, b.block, b.state); };

// Walls, foundations and interiors, cell by cell.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, { block: BASE });            // foundation fill: nothing floats on a slope
  for (let y = gr; y <= TOP; y++) {
    if (shell(x, z)) {
      const b = facadeBlock(x, z, y);
      put(x, y, z, b);
      if (b.block === GLASS) counts.glass++;
      else if (b.block === "dark_oak_door") counts.doors++;
      else if (b.block === "lantern") counts.lamps++;
      else if (b.block === WALL) counts.walls++;
    } else if (y === 0) put(x, y, z, { block: BASE });
    else if (y === TOP) put(x, y, z, { block: ROOF });
    else if (y % 2 === 0) put(x, y, z, { block: BELT });                 // floor slab per storey
    else if (lit.has(`${x},${y},${z}`)) { put(x, y, z, { block: GLOW }); counts.lamps++; }
    // else: the room is air
  }
}

// Roof equipment: two 2x2 HVAC boxes on the interior roof, apart from each other, near the middle of the roof.
const roofCells = cells.filter(([x, z]) => !shell(x, z));
const cx = roofCells.reduce((s, [x]) => s + x, 0) / roofCells.length;
const cz = roofCells.reduce((s, [, z]) => s + z, 0) / roofCells.length;
const boxes = [];
for (const [x, z] of roofCells) {
  const quad = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
  if (!quad.every(([qx, qz]) => inside(qx, qz) && !shell(qx, qz))) continue;
  const d = Math.abs(x + 0.5 - cx) + Math.abs(z + 0.5 - cz);
  boxes.push({ x, z, d, quad });
}
boxes.sort((a, b) => a.d - b.d);
const chosen = [];
for (const b of boxes) {
  if (chosen.length === 2) break;
  if (chosen.every((c) => Math.abs(c.x - b.x) >= 4 || Math.abs(c.z - b.z) >= 4)) chosen.push(b);
}
for (const b of chosen) for (const [qx, qz] of b.quad) { put(qx, TOP + 1, qz, { block: HVAC }); counts.hvac++; }

g.save(`${DIR}/201006.0002257.nbt`);
console.log(JSON.stringify({ footprint: cells.length, ...counts, palette: g.palette.length, blocks: g.count() }));
