// 3550 West Pacific Av (Miscellaneous / Mixed-Use), Presidio Tunnel Tops. Footprint 22 x 15, roof 3 blocks above the lowest ground.
// Read from the record: one storey of 2 blocks on a stone plinth with a quartz parapet, a 1930s stucco block in the
// Spanish Colonial Revival manner (white walls, quartz pilasters, red clay tile roof, dark wood shopfront on the street).
// The street is the +z edge; the downhill cells (ground 0) get an extra window row so the block stands level at the roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/sf/presidio-tunnel-tops/fill";
const cells = JSON.parse(readFileSync(`${DIR}/201006.0002752.cells.json`, "utf8"));   // [x, z, ground]

const SIZE = [22, 15, 15];
const ROOF = 3;             // roof level: the quartz parapet and the tile roof sit here, 3 blocks above the lowest ground
const STREET = [0, 1];      // +z edge faces the street: shopfront and the entrances
const DOOR_ALONG = [5, 16]; // street-front entrance bays (x)

const key = (x, z) => `${x},${z}`;
const ground = new Map(cells.map(([x, z, g]) => [key(x, z), g]));
const inside = (x, z) => ground.has(key(x, z));
const NORMALS = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const faces = (x, z) => NORMALS.filter(([dx, dz]) => !inside(x + dx, z + dz));
const shell = (x, z) => inside(x, z) && faces(x, z).length > 0;

// Each shell cell takes its street face when it has one, else its first exposed face; "along" runs down the facade.
function facadeOf(x, z) {
  const fs = faces(x, z);
  const f = fs.find(([nx, nz]) => nx === STREET[0] && nz === STREET[1]) ?? fs[0];
  return { n: f, street: f[0] === STREET[0] && f[1] === STREET[1], along: f[0] !== 0 ? z : x };
}

// Entrances: on the street front, at the chosen along-coordinates, on a ground cell with a shell face.
const doorKeys = new Set();
for (const [x, z] of cells) {
  if (!shell(x, z)) continue;
  const { street, along } = facadeOf(x, z);
  if (street && DOOR_ALONG.includes(along)) doorKeys.add(key(x, z));
}
// The awning runs over each entrance and one cell either side of it.
const canopyAt = (x, z) => { const { street, along } = facadeOf(x, z); return street && DOOR_ALONG.some((a) => Math.abs(along - a) <= 1); };

// Pane orientation: panes run along the facade (east-west on a street or back wall, north-south on the end walls).
const paneState = (n) => (n[0] !== 0
  ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
  : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });

const g = new Voxels(SIZE);
const counts = { walls: 0, glass: 0, doors: 0, lights: 0, hvac: 0 };

for (const [x, z, gr] of cells) {
  // Foundation fill from y 0 up to the cell's ground: nothing floats on the slope.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  if (!shell(x, z)) {
    // Interior: a floor slab at the storey line, the tile roof, and air between (no interiors).
    g.set(x, gr, z, "smooth_stone");
    g.set(x, ROOF, z, z % 2 === 0 ? "red_terracotta" : "terracotta");
    if (x % 8 === 4 && z % 6 === 3) {                                       // roof equipment: two HVAC boxes
      g.set(x, ROOF + 1, z, "light_gray_concrete"); g.set(x, ROOF + 2, z, "light_gray_concrete");
      counts.hvac++;
    }
    continue;
  }

  const { n, street, along } = facadeOf(x, z);
  const isDoor = doorKeys.has(key(x, z));
  const windowRows = gr === 0 ? [1, 2] : [gr + 1];   // downhill cells carry the extra storey as a second window row

  // Base course at the storey line, the plinth of the block.
  g.set(x, gr, z, isDoor ? "dark_oak_door" : "stone_bricks", isDoor
    ? { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" } : undefined);
  if (isDoor) { counts.doors++; g.set(x, gr + 1, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" }); }
  else counts.walls++;

  // Wall body: white stucco between quartz pilasters, glass panes in framed bays, shopfront frames on the street.
  for (const y of windowRows) {
    if (isDoor && y === gr + 1) continue;
    if (street) {
      if (along % 4 === 0) { g.set(x, y, z, "dark_oak_planks"); counts.walls++; continue; }   // shopfront frame
      g.set(x, y, z, "glass_pane", paneState(n)); counts.glass++;
      if (y === gr + 1 && along % 4 === 2) {                                   // warm light behind the shop glass
        const ix = x - n[0], iz = z - n[1];
        if (inside(ix, iz) && !shell(ix, iz)) { g.set(ix, y, iz, "glowstone"); counts.lights++; }
      }
      continue;
    }
    if (along % 3 === 0) { g.set(x, y, z, "smooth_quartz"); counts.walls++; continue; }    // pilaster
    g.set(x, y, z, "glass_pane", paneState(n)); counts.glass++;
    if (y === gr + 1 && along % 4 === 1) {                                     // a lit room behind every other bay
      const ix = x - n[0], iz = z - n[1];
      if (inside(ix, iz) && !shell(ix, iz)) { g.set(ix, y, iz, "glowstone"); counts.lights++; }
    }
  }

  // Wall body between the base and parapet: stucco fills whatever the bays did not take.
  for (let y = gr + 1; y < ROOF; y++) if (!g.get(x, y, z)) g.set(x, y, z, "white_concrete");

  // Parapet: quartz cornice course on the wall tops, red awning over each entrance.
  if (isDoor || (street && canopyAt(x, z))) g.set(x, ROOF, z, "red_wool");
  else g.set(x, ROOF, z, "smooth_quartz");
  counts.walls++;
}

const out = `${DIR}/201006.0002752.nbt`;
const r = g.save(out);
console.log(JSON.stringify({ footprint: cells.length, ...counts, ...r }));
