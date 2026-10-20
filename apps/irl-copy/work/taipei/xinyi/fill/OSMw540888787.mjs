import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540888787";
const W = 8, H = 23, D = 14;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cells = raw.map((c) => {
  if (Array.isArray(c)) return { x: c[0], z: c[1], g: Math.max(0, Math.round(c[2])) };
  return { x: c.x, z: c.z, g: Math.max(0, Math.round(c.ground ?? c.g ?? c[2] ?? 0)) };
});

const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const groundAt = new Map(cells.map((c) => [key(c.x, c.z), c.g]));
const has = (x, z) => groundAt.has(key(x, z));
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const minX = Math.min(...cells.map((c) => c.x));
const minZ = Math.min(...cells.map((c) => c.z));

// Pass 1: foundation, slabs, walls, windows, cornice, parapet
for (const { x, z, g: gr } of cells) {
  // foundation up to ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // floor slabs at each storey line (interior and edge)
  put(x, gr, z, "smooth_stone");          // ground floor slab
  put(x, gr + 5, z, "smooth_stone");      // storey 2 floor slab
  put(x, gr + 10, z, "light_gray_concrete"); // roof deck

  if (!isEdge(x, z)) continue;

  const t = (x + z) % 2; // 0 = window bay, 1 = pier

  // Storey 1 (ground shopfront): g+1..g+4
  for (let y = gr + 1; y <= gr + 3; y++) {
    if (t === 0) put(x, y, z, "light_blue_stained_glass");
    else put(x, y, z, "stone_bricks");
  }
  put(x, gr + 4, z, "stone_bricks"); // fascia / lintel course

  // Storey 2: g+6..g+9
  if (t === 0) {
    put(x, gr + 6, z, "smooth_quartz");                 // sill
    put(x, gr + 7, z, "light_blue_stained_glass_pane");  // glazing
    put(x, gr + 8, z, "light_blue_stained_glass_pane");
    put(x, gr + 9, z, "smooth_quartz");                  // head
  } else {
    for (let y = gr + 6; y <= gr + 9; y++) put(x, y, z, "white_concrete");
  }

  // Cornice and parapet
  put(x, gr + 10, z, "smooth_quartz");
  put(x, gr + 11, z, "white_concrete");
}

// Pass 2: entrance on the lowest-z street face, lanterns and glowstone behind glass
const streetCells = cells.filter((c) => c.z === minZ && isEdge(c.x, c.z));
const midX = minX + Math.floor((Math.max(...cells.map((c) => c.x)) - minX) / 2);
let door = streetCells.length
  ? streetCells.reduce((a, b) => (Math.abs(b.x - midX) < Math.abs(a.x - midX) ? b : a))
  : null;

if (door) {
  const { x, z, g: gr } = door;
  put(x, gr + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, gr + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(x, gr + 3, z, "light_blue_stained_glass");
  put(x, gr + 4, z, "stone_bricks");
  // entrance lantern flanking the door, on the interior side
  if (has(x + 1, z) && !isEdge(x + 1, z)) {
    put(x + 1, groundAt.get(key(x + 1, z)) + 1, z, "lantern", { hanging: "false" });
  }
}

for (const { x, z, g: gr } of cells) {
  if (!isEdge(x, z)) continue;
  const t = (x + z) % 2;
  // Warm light behind some shopfront glass (interior air cell one step inward)
  if (t === 0 && (x % 4) === 0 && has(x, z + 1) && !isEdge(x, z + 1)) {
    put(x, gr + 1, z + 1, "lantern", { hanging: "false" });
  }
  // Glowstone behind some upper-storey glazing
  if (t === 0 && (x % 4) === 2 && has(x, z + 1) && !isEdge(x, z + 1)) {
    put(x, gr + 6, z + 1, "glowstone");
  }
}

// Pass 3: roof equipment on the deck (AC plant block, 2x2)
for (const { x, z, g: gr } of cells) {
  if (isEdge(x, z)) continue;
  const dx = x - minX, dz = z - minZ;
  if ((dx === 2 || dx === 3) && (dz === 4 || dz === 5)) {
    put(x, gr + 11, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
