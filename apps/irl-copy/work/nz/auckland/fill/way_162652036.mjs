// The Lapwood Spiral: a 1970s concrete-frame office tower on a stepped podium (Auckland CBD, Mt Eden view).
// Massing from the lidar roof: wings to y48, a setback ring at y50, the tower core at y53 with a plant room.
// Storey lines sit on absolute rows (every 4 y); the pier pattern steps one bay per storey, so the bands
// read as a diagonal spiral from the street and the air. Facade = 1 block of glass/pier, an air gap behind
// the glass (depth-2 cells), a solid core; every row stands on the one below.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_162652036.cells.json`, "utf8"));
const SX = 26, SY = 67, SZ = 20;

const key = (x, z) => `${x},${z}`;
const at = new Map();
const list = cells.map(([x, z, g, r]) => {
  // Lidar roof → three clean tiers. Edge noise (r < 46) joins the wings.
  const T = r >= 52 ? 53 : r >= 50 ? 50 : 48;
  const c = { x, z, g, r, T };
  at.set(key(x, z), c);
  return c;
});
const cell = (x, z) => at.get(key(x, z));
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Ring = exposed to the sky or to open air at the side (outside the footprint, or a neighbour tier is lower).
for (const c of list) c.ring = NB.some(([dx, dz]) => { const n = cell(c.x + dx, c.z + dz); return !n || n.T < c.T; });
// Depth inward from the ring: depth 2 is the air gap behind the glass.
const queue = list.filter(c => c.ring);
for (const c of queue) c.d = 1;
for (let i = 0; i < queue.length; i++) {
  const c = queue[i];
  for (const [dx, dz] of NB) {
    const n = cell(c.x + dx, c.z + dz);
    if (n && n.d === undefined) { n.d = c.d + 1; queue.push(n); }
  }
}

// Entrance on the west wall at (0,7), ground y0.
const DOOR = { x: 0, z: 7 };

const g = new Voxels([SX, SY, SZ]);
const put = (x, y, z, block, state) => { if (g.inBounds(x, y, z)) g.set(x, y, z, block, state); };

// Glass pane connects to a neighbouring ring cell that is solid at this row.
function paneState(c, y) {
  const s = {};
  for (const [dir, dx, dz] of [["east", 1, 0], ["west", -1, 0], ["south", 0, 1], ["north", 0, -1]]) {
    const n = cell(c.x + dx, c.z + dz);
    s[dir] = String(!!n && n.ring && y >= n.g && y < n.T);
  }
  return { ...s, waterlogged: "false" };
}

for (const c of list) {
  const { x, z, g: gr, T: top } = c;
  const outside = NB.some(([dx, dz]) => !cell(x + dx, z + dz));
  const groundTop = 4 * (Math.floor(gr / 4) + 1);   // first slab row above grade: the shopfront storey
  const litRow = (y) => ((x * 5 + z * 3 + Math.floor(y / 4) * 7) % 13 === 0) && y % 4 === 1;

  for (let y = 0; y < gr; y++) put(x, y, z, c.ring ? "polished_granite" : "stone_bricks");   // foundation to grade

  for (let y = gr; y < top; y++) {
    if (y === top - 1) { put(x, y, z, "smooth_stone"); continue; }         // roof deck
    if (y === gr) { put(x, y, z, c.ring ? "polished_granite" : "stone"); continue; }  // base course
    if (y % 4 === 0) { put(x, y, z, c.ring ? "light_gray_concrete" : "stone"); continue; }  // storey slab
    if (!c.ring) {
      if (c.d === 2) { if (litRow(y)) put(x, y, z, "glowstone"); }           // air gap behind the glass
      else put(x, y, z, "stone");
      continue;
    }
    const s = Math.floor(y / 4);
    const pier = (x + z + s) % 3 === 0;
    if (y < groundTop) {                                                     // commercial ground storey
      if (x === DOOR.x && z === DOOR.z && (y === 1 || y === 2)) {
        put(x, y, z, "dark_oak_door", { facing: "east", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      } else if (x === DOOR.x && z >= DOOR.z - 1 && z <= DOOR.z + 1 && y === 3) {
        put(x, y, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });   // recessed canopy lintel
      } else {
        put(x, y, z, pier ? "polished_granite" : "cyan_stained_glass");
      }
    } else {
      put(x, y, z, pier ? "white_concrete" : "cyan_stained_glass_pane", pier ? undefined : paneState(c, y));
    }
  }

  // Parapet on the outer edge of the roof (two rows, cap on top).
  if (outside) for (let y = top; y < top + 2; y++) put(x, y, z, y === top ? "white_concrete" : "smooth_quartz");
}

// Entrance glow behind the door and the shopfront.
for (const [dx, dz] of [[1, 6], [1, 7], [1, 8]]) put(dx, 1, dz, "glowstone");

// Setback terrace: AC plant units on the 50 deck.
for (const c of list) if (c.T === 50 && !c.ring && (c.x + c.z) % 5 === 0) put(c.x, 50, c.z, "iron_block");

// Tower plant room on the 53 deck (x 16..19, z 9..13), roof at 56, lightning rod to 60.
for (let x = 16; x <= 19; x++) for (let z = 9; z <= 13; z++) {
  const c = cell(x, z);
  if (!c || c.T !== 53) throw new Error(`plant room cell ${x},${z} is not on the tower tier`);
  const edge = x === 16 || x === 19 || z === 9 || z === 13;
  put(x, 53, z, "white_concrete");
  put(x, 54, z, edge ? "iron_bars" : "stone", edge ? { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" } : undefined);
  put(x, 55, z, edge ? "light_gray_concrete" : "stone");
  put(x, 56, z, "smooth_stone");
}
for (let y = 57; y <= 60; y++) put(17, y, 11, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

const out = `${DIR}/way_162652036.nbt`;
const { blocks, palette } = g.save(out);
console.log(JSON.stringify({ out, blocks, palette }));
