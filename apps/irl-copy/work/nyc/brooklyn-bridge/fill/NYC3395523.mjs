import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3395523";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 10, H = 15, D = 6;
const g = new Voxels([W, H, D]);

// Footprint: "x,z" -> ground
const ground = new Map();
const roofs = [];
for (const [x, z, gr, rf] of cells) {
  ground.set(`${x},${z}`, Math.round(gr));
  roofs.push(Math.round(rf));
}
const inside = (x, z) => ground.has(`${x},${z}`);

// One clean flat roof line: median of the lidar roofs, never below 4 blocks over the highest ground
roofs.sort((a, b) => a - b);
const medianRoof = roofs[Math.floor(roofs.length / 2)];
const maxGround = Math.max(...ground.values());
const ROOF = Math.min(H - 3, Math.max(medianRoof, maxGround + 4));
const TOP = ROOF - 1; // roof deck / cap layer

function outwardDirs(x, z) {
  const out = [];
  if (!inside(x, z - 1)) out.push({ name: "north", dx: 0, dz: -1 });
  if (!inside(x, z + 1)) out.push({ name: "south", dx: 0, dz: 1 });
  if (!inside(x - 1, z)) out.push({ name: "west", dx: -1, dz: 0 });
  if (!inside(x + 1, z)) out.push({ name: "east", dx: 1, dz: 0 });
  return out;
}

// Entrance: single-face perimeter cell nearest the middle of the north (low z) face
let door = null;
{
  let best = Infinity;
  for (const [key, gy] of ground) {
    const [x, z] = key.split(",").map(Number);
    const dirs = outwardDirs(x, z);
    if (dirs.length !== 1) continue;
    const d = dirs[0];
    const score = Math.abs(x - (W - 1) / 2) + (d.name === "north" ? 0 : 3);
    if (score < best) { best = score; door = { x, z, d, gy }; }
  }
}

// Pass 1: foundation, plinth, brick walls, glazing, cap
for (const [key, gy] of ground) {
  const [x, z] = key.split(",").map(Number);
  const dirs = outwardDirs(x, z);
  const perimeter = dirs.length > 0;
  const corner = dirs.length >= 2;

  // Rubble foundation from y 0 up to this cell's ground
  for (let y = 0; y < gy; y++) g.set(x, y, z, "cobblestone");

  // Limestone plinth / floor slab at ground level
  g.set(x, gy, z, "smooth_stone");
  if (!perimeter) {
    // Interior floor, air above
  }

  if (perimeter) {
    const isDoorCell = door && door.x === x && door.z === z;
    const nearDoor = door && Math.abs(door.x - x) === 1 && door.z === z;
    for (let y = gy + 1; y <= TOP - 1; y++) {
      if (corner || nearDoor) {
        g.set(x, y, z, "stone_bricks"); // corner pilasters and door surround
        continue;
      }
      if (isDoorCell && y <= gy + 2) continue; // door opening
      const idx = dirs[0].name === "north" || dirs[0].name === "south" ? x : z;
      if (idx % 2 === 1) {
        g.set(x, y, z, "glass_pane");
      } else {
        g.set(x, y, z, "bricks");
      }
    }
    // Limestone cornice course on top of the wall (cap is inset by a slab band)
    g.set(x, TOP, z, corner ? "stone_bricks" : "stone_brick_slab", corner ? undefined : { type: "top", waterlogged: "false" });
  } else {
    // Interior: roof deck just under the cap
    g.set(x, TOP, z, "smooth_stone");
  }
}

// Warm light behind some windows
for (const [key, gy] of ground) {
  const [x, z] = key.split(",").map(Number);
  const dirs = outwardDirs(x, z);
  if (dirs.length !== 1) continue;
  const d = dirs[0];
  const idx = d.name === "north" || d.name === "south" ? x : z;
  if (idx % 4 !== 1) continue;
  const ix = x - d.dx, iz = z - d.dz;
  if (!inside(ix, iz) || outwardDirs(ix, iz).length) continue;
  g.set(ix, gy + 1, iz, "glowstone");
}

// Pass 2: entrance door, lantern, rooftop vent
if (door) {
  const { x, z, d, gy } = door;
  g.set(x, gy + 1, z, "iron_door", { facing: d.name, half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, gy + 2, z, "iron_door", { facing: d.name, half: "upper", hinge: "left", open: "false", powered: "false" });
  if (ROOF < H) g.set(x, ROOF, z, "lantern", { hanging: "false", waterlogged: "false" });
}

// Roof vent near the centre
{
  let best = null, bestD = Infinity;
  for (const [key] of ground) {
    const [x, z] = key.split(",").map(Number);
    if (outwardDirs(x, z).length) continue;
    const dist = Math.abs(x - (W - 1) / 2) + Math.abs(z - (D - 1) / 2);
    if (dist < bestD) { bestD = dist; best = { x, z }; }
  }
  if (best) {
    if (ROOF < H) g.set(best.x, ROOF, best.z, "iron_block");
    if (ROOF + 1 < H) g.set(best.x, ROOF + 1, best.z, "iron_bars");
  }
}

g.save(`${DIR}/${ID}.nbt`);
