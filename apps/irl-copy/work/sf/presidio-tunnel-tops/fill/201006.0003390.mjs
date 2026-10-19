// 201006.0003390, Presidio Tunnel Tops: an Army quarters block of the Main Post, 24 x 17 blocks (48 x 34 m).
// Read from the record (none, so decided here): 1910s Colonial Revival, two storeys of 2 blocks each (4 m a storey),
// red brick on a stone base, quartz storey band and parapet, white-painted sash in glass panes, a dark tile roof
// with two brick chimneys and a quartz pavilion at the middle of the roof. The entrance sits on the longest run of
// street-facing wall; the ground floor and the first floor are each a floor slab, with air between (no interiors).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/sf/presidio-tunnel-tops/fill";
const cells = JSON.parse(readFileSync(`${DIR}/201006.0003390.cells.json`, "utf8"));   // [x, z, ground]

const SIZE = [24, 16, 17];
const ROOF = 4;            // roof and parapet layer: 4 blocks above the lowest ground, as the record says
const FLOOR = [0, 2];      // storey floor slabs (ground floor, first floor)
const WINDOW_ROWS = [1, 3];// glass rows: one per storey, above each floor slab
const BAND = 2;            // quartz storey line between the storeys

const key = (x, z) => `${x},${z}`;
const ground = new Map(cells.map(([x, z, g]) => [key(x, z), g]));
const inside = (x, z) => ground.has(key(x, z));
const NORMALS = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const faces = (x, z) => NORMALS.filter(([dx, dz]) => !inside(x + dx, z + dz));
const shell = (x, z) => inside(x, z) && faces(x, z).length > 0;
const corner = (x, z) => faces(x, z).length >= 2;

// Facade runs: consecutive shell cells that share one exposed normal and one fixed coordinate.
// "along" is the coordinate that runs down the wall (x on a north or south face, z on an east or west face).
const runs = new Map();
for (const [x, z] of cells) {
  if (!shell(x, z) || corner(x, z)) continue;
  const [n] = faces(x, z);
  const along = n[0] !== 0 ? z : x;
  const fixed = n[0] !== 0 ? x : z;   // placeholder; grouped below by the line the wall lies on
  const line = n[0] !== 0 ? `${n[0]}:x` : `${n[1]}:z`;
  const lineKey = n[0] !== 0 ? `${line}:${x}` : `${line}:${z}`;
  if (!runs.has(lineKey)) runs.set(lineKey, { n, cells: [] });
  runs.get(lineKey).cells.push({ x, z, along, fixed });
}
// Split each line into contiguous runs.
const facades = [];
for (const { n, cells: cs } of runs.values()) {
  cs.sort((a, b) => a.along - b.along);
  let cur = [];
  for (const c of cs) {
    if (cur.length && c.along !== cur[cur.length - 1].along + 1) { facades.push({ n, cells: cur }); cur = []; }
    cur.push(c);
  }
  if (cur.length) facades.push({ n, cells: cur });
}

// The entrance: the longest facade run; the door sits at its middle (on the first run found if tied).
const street = facades.reduce((best, f) => (f.cells.length > (best?.cells.length ?? 0) ? f : best), null);
const doorAlong = street.cells[Math.floor(street.cells.length / 2)].along;
const doorN = street.n;
const doorKeys = new Set(street.cells.filter((c) => c.along === doorAlong).map((c) => key(c.x, c.z)));
const surroundKeys = new Set(street.cells.filter((c) => Math.abs(c.along - doorAlong) === 1).map((c) => key(c.x, c.z)));

// Window bays along each facade: a 2-wide glass pair, then a brick pier, repeating every 4 blocks from the run's start.
const bayOf = new Map();
let windowCount = 0;
for (const f of facades) {
  f.cells.forEach((c, k) => {
    if (doorKeys.has(key(c.x, c.z)) || surroundKeys.has(key(c.x, c.z))) return;
    const pos = k % 4;
    if (pos === 1 || pos === 2) bayOf.set(key(c.x, c.z), { n: f.n, lamp: windowCount++ % 3 === 0 });
  });
}

const paneState = (n) => (n[0] !== 0
  ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
  : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });
const doorState = (n, half) => ({
  facing: n[1] !== 0 ? (n[1] > 0 ? "south" : "north") : (n[0] > 0 ? "east" : "west"),
  half, hinge: "left", open: "false", powered: "false",
});

// Central pavilion on the roof, 5 x 3 cells near the middle of the footprint, where every cell is interior.
const pavilion = [];
for (let x = 9; x <= 13; x++) for (let z = 6; z <= 8; z++) if (inside(x, z) && !shell(x, z)) pavilion.push([x, z]);
const pavKeys = new Set(pavilion.map(([x, z]) => key(x, z)));
const pavEdge = (x, z) => !pavKeys.has(key(x - 1, z)) || !pavKeys.has(key(x + 1, z)) || !pavKeys.has(key(x, z - 1)) || !pavKeys.has(key(x, z + 1));
const CHIMNEYS = [[4, 5], [18, 8]];

const g = new Voxels(SIZE);
const counts = { walls: 0, doors: 0, glass: 0, lights: 0, roof: 0, pavilion: 0 };

for (const [x, z, gr] of cells) {
  // Foundation fill from y 0 up to the cell's ground (all cells here sit on y 0, so this is a no-op kept for the record).
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  if (!shell(x, z)) {
    // Interior: a floor slab per storey, air between, and the roof deck over the top.
    for (const f of FLOOR) g.set(x, f + gr, z, f === 0 ? "smooth_stone" : "spruce_planks");
    g.set(x, ROOF, z, "deepslate_tiles");
    counts.roof++;
    continue;
  }

  const key0 = key(x, z);
  const bay = bayOf.get(key0);

  if (corner(x, z)) {
    // Corner pilasters: stone base, quartz shaft to the parapet.
    g.set(x, gr, z, "stone_bricks");
    for (let y = gr + 1; y < ROOF; y++) g.set(x, y, z, "quartz_pillar", { axis: "y" });
    g.set(x, ROOF, z, "smooth_quartz");
    counts.walls++;
    continue;
  }

  const [n] = faces(x, z);
  // Base course in stone, the quartz storey band, and the parapet cap in quartz.
  if (doorKeys.has(key0)) {
    g.set(x, gr, z, "dark_oak_door", doorState(doorN, "lower"));
    g.set(x, gr + 1, z, "dark_oak_door", doorState(doorN, "upper"));
    counts.doors++;
    g.set(x, BAND + gr, z, "smooth_quartz");   // lintel band over the door
    g.set(x, ROOF, z, "smooth_quartz");
    counts.walls++;
    continue;
  }
  g.set(x, gr, z, "stone_bricks");
  g.set(x, BAND + gr, z, "smooth_quartz");
  g.set(x, ROOF, z, "smooth_quartz");
  counts.walls++;

  if (surroundKeys.has(key0)) {
    // Door surround: quartz jambs at both storeys beside the door.
    g.set(x, gr + 1, z, "smooth_quartz");
    g.set(x, gr + 3, z, "smooth_quartz");
    counts.walls += 2;
    continue;
  }

  for (const y of WINDOW_ROWS) {
    if (bay) {
      g.set(x, y + gr, z, "glass_pane", paneState(n)); counts.glass++;
      if (bay.lamp) {
        const ix = x - n[0], iz = z - n[1];
        if (inside(ix, iz) && !shell(ix, iz)) {
          // Lamp inside the window bay: standing on the floor at the lower storey, hanging from the roof at the upper.
          if (y === 1) g.set(ix, 1 + gr, iz, "lantern", { hanging: "false", waterlogged: "false" });
          else g.set(ix, 3 + gr, iz, "lantern", { hanging: "true", waterlogged: "false" });
          counts.lights++;
        }
      }
    } else {
      g.set(x, y + gr, z, "bricks"); counts.walls++;
    }
  }
}

// Storey lines run round the whole pavilion: the pavilion walls stand from the roof deck to a quartz cap.
for (const [x, z] of pavilion) {
  g.set(x, ROOF, z, "deepslate_tiles");
  if (pavEdge(x, z)) {
    g.set(x, ROOF + 1, z, "smooth_quartz"); g.set(x, ROOF + 2, z, "smooth_quartz");
    counts.pavilion += 2;
  } else {
    g.set(x, ROOF + 1, z, "glass_pane", { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
    g.set(x, ROOF + 2, z, "glass_pane", { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
    counts.pavilion += 2;
  }
  g.set(x, ROOF + 3, z, "smooth_quartz");
}
// A lantern under the pavilion cap, lighting the roof room.
g.set(11, ROOF + 2, 7, "lantern", { hanging: "true", waterlogged: "false" });
counts.lights++;

// Entrance pediment: the three wall cells at the door stand one block proud of the parapet, the door bay two, so the
// front has a centre accent from the air and the street.
for (const c of street.cells) {
  const d = Math.abs(c.along - doorAlong);
  if (d <= 1) g.set(c.x, ROOF + 1, c.z, "smooth_quartz");
  if (d === 0) g.set(c.x, ROOF + 2, c.z, "smooth_quartz");
}

// Two brick chimney stacks on the roof deck, capped with stone slabs.
for (const [x, z] of CHIMNEYS) {
  g.set(x, ROOF, z, "bricks"); g.set(x, ROOF + 1, z, "bricks"); g.set(x, ROOF + 2, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

const out = `${DIR}/201006.0003390.nbt`;
const r = g.save(out);
console.log(JSON.stringify({ footprint: cells.length, facades: facades.length, street: { n: doorN, len: street.cells.length, doorAlong }, ...counts, ...r }));
