// FR245184463: a Haussmann-era residential block (1850, six storeys of cream limestone, zinc-grey roof cover), built on the
// lidar footprint. Storeys are 4 blocks (a string course, two window rows, a lintel), so the string courses fall on
// y = 2 mod 4 from the plinth at y = 2 and every roof tier (6, 10, ..., 26) lands on a lintel row. Walls are a one-block
// shell with air behind the glass; interiors are only the floor slabs and the roof deck. The lidar's roof heights are
// snapped to the storey tiers, so the massing steps down in clean setbacks to the lower wings.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR245184463.cells.json`, "utf8"));   // [x, z, ground, roof] per cell

const W = 39, H = 40, D = 49;
const TOPS = [6, 10, 14, 18, 22, 26];               // roof tiers: the top of storey 0..5 (rows 2..25 are the six storeys)
const WALL = "calcite", STRING = "smooth_sandstone", PLINTH = "stone_bricks", ROOF = "deepslate_tiles";

const fp = new Map();                               // "x,z" -> { g, top, face, edge }
for (const [x, z, g, r] of cells) {
  const top = TOPS.reduce((best, t) => (Math.abs(t - r) < Math.abs(best - r) ? t : best));
  fp.set(`${x},${z}`, { g, top });
}
const at = (x, z) => fp.get(`${x},${z}`);
const NEI = [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]];
const FACE_OF = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };

// A cell is on the shell when a neighbour is outside the footprint; its facade faces that way (north/south first).
for (const [key, c] of fp) {
  const [x, z] = key.split(",").map(Number);
  const open = NEI.filter(([, dx, dz]) => !at(x + dx, z + dz)).map(([n]) => n);
  c.open = open;
  c.edge = open.length > 0;
  c.face = open.find((n) => n === "north" || n === "south") ?? open[0] ?? null;
}

// The facade's bay position along its own run: x for north/south faces, z for east/west.
const along = (x, z, face) => (face === "north" || face === "south" ? x : z);

// The faces of a cell at row y that look onto air: outside the footprint, or beside a lower tier that has ended by y.
// A taller tier's side over a lower wing is a facade too, so it is walled like the footprint edge.
const exposedAt = (x, z, y) => NEI.filter(([, dx, dz]) => { const n = at(x + dx, z + dz); return !n || n.top <= y; }).map(([n]) => n);
const preferred = (dirs) => dirs.find((n) => n === "north" || n === "south") ?? dirs[0] ?? null;

// The entrance: the street-side (north or south) cell with the most facade cells around it, on a window bay.
let door = null;
{
  let best = -1;
  for (const [key, c] of fp) {
    if (!c.edge || !(c.face === "north" || c.face === "south")) continue;
    const [x, z] = key.split(",").map(Number), a = along(x, z, c.face);
    if (a % 3 === 2) continue;                          // a pillar bay is not a door
    let run = 0;
    for (let d = -3; d <= 3; d++) {
      const n = at(x + d, z);
      if (n && n.edge && n.face === c.face) run++;
    }
    if (run > best) { best = run; door = { x, z, face: c.face }; }
  }
}

const g = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);
const paneState = (face) => (face === "north" || face === "south"
  ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

// 1. Foundation and walls, per column.
for (const [key, c] of fp) {
  const [x, z] = key.split(",").map(Number);
  const base = Math.max(c.g, 2);                    // solid below the ground, and the plinth row always
  for (let y = 0; y < base; y++) put(x, y, z, PLINTH);
  for (let y = base; y < c.top; y++) {
    const r = (y - 2) % 4;                          // 0 string course, 1-2 window rows, 3 lintel
    const face = preferred(exposedAt(x, z, y));     // null where the cell is enclosed on every side at this row
    if (y === c.top - 1) { put(x, y, z, face ? STRING : ROOF); continue; }    // the cornice on the shell, roof deck inside
    if (!face) { if (r === 0) put(x, y, z, STRING); continue; }               // interior: a floor slab per storey, air between
    const a = along(x, z, face);
    const pillar = a % 3 === 2;
    if (y === 2) put(x, y, z, PLINTH);
    else if (r === 0) put(x, y, z, STRING);
    else if (pillar) put(x, y, z, STRING);
    else if (r === 3) put(x, y, z, WALL);
    else put(x, y, z, "glass_pane", paneState(face));
  }
}

// 2. The entrance: a dark oak door on the ground storey, flanked by two standing lanterns, on the street-side facade.
if (door) {
  const face = door.face;
  const doorState = (half) => ({ facing: face, half, hinge: "left", open: "false", powered: "false" });
  put(door.x, 3, door.z, "dark_oak_door", doorState("lower"));
  put(door.x, 4, door.z, "dark_oak_door", doorState("upper"));
  for (const d of [-1, 1]) {
    const nx = door.x + (face === "north" || face === "south" ? d : 0);
    const nz = door.z + (face === "east" || face === "west" ? d : 0);
    const n = at(nx, nz);
    if (n && n.edge) put(nx, 3, nz, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// 3. Warm light behind some windows: a glowstone on the floor slab inside the glass, where the cell behind is interior.
for (const [key, c] of fp) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 3; y < c.top - 1; y++) {
    if ((y - 2) % 4 !== 1) continue;                // the lower window row
    const face = preferred(exposedAt(x, z, y));
    if (!face || along(x, z, face) % 3 === 2) continue;
    const [dx, dz] = FACE_OF[face];
    const ix = x - dx, iz = z - dz, inner = at(ix, iz);
    if (!inner || inner.top <= y || exposedAt(ix, iz, y).length) continue;   // the room behind must be enclosed air
    if ((x * 31 + z * 17 + y * 7) % 5 === 0 && !(door && door.x === x && door.z === z)) put(ix, y, iz, "glowstone");
  }
}

// 4. Chimneys on the roof of the higher tiers, standing on the interior roof deck.
for (const [key, c] of fp) {
  const [x, z] = key.split(",").map(Number);
  if (c.edge || c.top < 14) continue;
  if ((x * 7 + z * 3) % 11 !== 0) continue;
  put(x, c.top, z, "bricks"); put(x, c.top + 1, z, "bricks");
  put(x, c.top + 2, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/FR245184463.nbt`);
