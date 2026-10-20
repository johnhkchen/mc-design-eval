import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1071343649";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 24, H = 23, D = 21;
const g = new Voxels([W, H, D]);

// Two-storey mid-century commercial block with a shopfront base, a banded
// upper floor, a cornice and parapet, and a small rooftop plant enclosure.
const key = (x, z) => `${x},${z}`;
const groundOf = new Map();
for (const [x, z, gr] of cells) groundOf.set(key(x, z), gr);
const has = (x, z) => groundOf.has(key(x, z));

const DIRS = [[0, -1, "north"], [0, 1, "south"], [1, 0, "east"], [-1, 0, "west"]];

// Exterior cells: any footprint cell with a missing 4-neighbour; remember the outward side.
const ext = new Map();
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  for (const [dx, dz, name] of DIRS) {
    if (!has(x + dx, z + dz)) { ext.set(key(x, z), [dx, dz, name]); break; }
  }
}
const isExt = (x, z) => ext.has(key(x, z));

// 1. Foundations and floor/roof slabs on every footprint cell.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr && y < H; y++) g.set(x, y, z, "stone_bricks");
  g.set(x, 5, z, "smooth_stone");   // floor slab / storey line
  g.set(x, 10, z, "smooth_stone");  // roof deck, sits on the walls below
}

// 2. Facade walls on exterior cells.
let door = null;
{
  const parsed = [...ext.entries()].map(([k, o]) => {
    const [x, z] = k.split(",").map(Number);
    return { x, z, o, gr: groundOf.get(k) };
  });
  // Entrance: on the north face (lowest z), nearest the middle, ground at most 3.
  const pool = parsed.filter(c => c.o[2] === "north" && c.gr <= 3);
  const fallback = parsed.filter(c => c.gr <= 3);
  const list = pool.length ? pool : fallback;
  if (list.length) {
    list.sort((a, b) => Math.abs(a.x - 11.5) - Math.abs(b.x - 11.5));
    door = list[0];
  }
}

const isDoorCell = (x, z) => door && door.x === x && door.z === z;

for (const [x, z, gr] of cells) {
  if (!isExt(x, z)) continue;
  const o = ext.get(key(x, z));
  const alongX = o[0] === 0;                 // wall runs east-west
  const p = alongX ? x : z;                  // position along the facade
  const winCol = p % 3 !== 0;                // pier every third column
  const paneProps = alongX
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

  for (let y = gr; y <= 9 && y < H; y++) {
    if (isDoorCell(x, z) && y >= gr && y <= gr + 1) continue;
    if (y === gr) {
      g.set(x, y, z, "polished_andesite");           // base course
    } else if (y === 5) {
      g.set(x, y, z, "smooth_stone");                // storey line
    } else if (y < 5) {
      if (winCol) g.set(x, y, z, "glass_pane", paneProps);
      else g.set(x, y, z, "smooth_quartz");           // shopfront pier
    } else if (y === 6 || y === 9) {
      g.set(x, y, z, "white_concrete");               // spandrel bands
    } else {
      if (winCol) g.set(x, y, z, "glass_pane", paneProps);
      else g.set(x, y, z, "white_concrete");          // upper piers
    }
  }

  // Parapet and cornice cap.
  if (gr <= 10) g.set(x, 11, z, "white_concrete");
}

// 3. Entrance door on the shopfront.
if (door) {
  const facing = door.o[2];
  g.set(door.x, door.gr, door.z, "oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(door.x, door.gr + 1, door.z, "oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
}

// 4. Warm lights in a few windows, placed one cell inside behind the glass.
for (const [x, z, gr] of cells) {
  if (!isExt(x, z)) continue;
  const o = ext.get(key(x, z));
  const alongX = o[0] === 0;
  const p = alongX ? x : z;
  if (p % 3 === 0) continue;
  const ix = x - o[0], iz = z - o[1];
  if (!has(ix, iz) || isExt(ix, iz)) continue;
  // Upper floor: shroomlight behind selected windows.
  if (p % 6 === 1) g.set(ix, 7, iz, "shroomlight");
  // Ground floor: glowstone behind selected shopfront panes.
  if (p % 6 === 4 && gr + 1 <= 4 && !(door && door.x === x && door.z === z)) {
    g.set(ix, gr + 1, iz, "glowstone");
  }
}

// 5. Rooftop plant enclosure, set back from the parapet.
for (let x = 8; x <= 15; x++) {
  for (let z = 7; z <= 13; z++) {
    if (!has(x, z) || isExt(x, z)) continue;
    g.set(x, 11, z, "light_gray_concrete");
    if (x >= 9 && x <= 14 && z >= 8 && z <= 12) g.set(x, 12, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
