// Way 948317516, Eden Terrace / Mt Eden side street: a one-storey 1920s brick shop block with a tall parapet and an
// attic band, built on the lidar footprint. Brick piers on a 3-block bay rhythm, glazed shopfront, a timber-and-glass
// door with hanging lanterns, stone storey line, cream cornice; lower wing to the south-east. Lidar roof heights are
// smoothed into flat tiers by 3x3 majority so the roof reads as level steps, not noise.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_948317516.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_948317516.nbt";

// footprint: "x,z" -> { g: ground, r: lidar roof }
const cell = new Map();
for (const [x, z, gr, r] of cells) cell.set(`${x},${z}`, { g: gr, r });
const get = (x, z) => cell.get(`${x},${z}`);

// flat tiers: each cell takes the roof value that holds the most of its 3x3 neighbourhood (a tie keeps its own lidar value)
const tier = new Map();
for (const [k, c] of cell) {
  const [x, z] = k.split(",").map(Number);
  const votes = new Map();
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const n = get(x + dx, z + dz); if (n) votes.set(n.r, (votes.get(n.r) ?? 0) + 1);
  }
  let best = c.r, bestN = votes.get(c.r) ?? 0;
  for (const [v, n] of votes) if (n > bestN) { best = v; bestN = n; }
  tier.set(k, best);
}
const roofAt = (x, z) => tier.get(`${x},${z}`);

// the sides of a cell that face outside the footprint or a different roof tier: those are the walls
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const exposed = (x, z) => {
  const r = roofAt(x, z); const out = [];
  for (const [d, [dx, dz]] of Object.entries(DIRS)) if (roofAt(x + dx, z + dz) !== r) out.push(d);
  return out;
};
const isShell = (x, z) => get(x, z) && exposed(x, z).length > 0;

// the front door on the south face and the two hanging lanterns either side of it
const DOOR = [14, 7];
const LANTERNS = [[13, 7], [16, 7]];

const g = new Voxels([20, 20, 8]);
const isDoor = (x, z) => x === DOOR[0] && z === DOOR[1];
const isLantern = (x, z) => LANTERNS.some(([lx, lz]) => lx === x && lz === z);

for (const [k, c] of cell) {
  const [x, z] = k.split(",").map(Number);
  const gr = c.g, top = roofAt(x, z);          // top = the roof surface (y); the cornice is the block at top - 1
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");   // foundation up to this cell's ground

  const ex = exposed(x, z);
  if (!ex.length) {                            // interior: a floor slab per storey, a roof slab on top, air between
    g.set(x, gr, z, "smooth_stone");
    g.set(x, gr + 3, z, "smooth_stone");
    g.set(x, top - 1, z, "stone");
    continue;
  }

  // the wall column: base course, shopfront, storey line, upper windows, cornice
  const corner = ex.some((d) => d === "N" || d === "S") && ex.some((d) => d === "E" || d === "W");
  const u = ex.some((d) => d === "N" || d === "S") ? x : z;   // position along the face the wall is on
  const pier = corner || u % 3 === 0;
  for (let y = gr; y < top; y++) {
    if (y === gr) { g.set(x, y, z, "polished_andesite"); continue; }                  // base course
    if (y === top - 1) { g.set(x, y, z, "white_concrete"); continue; }                 // cornice / parapet cap
    if (y === gr + 3) { g.set(x, y, z, "smooth_stone"); continue; }                    // storey line
    if (corner) { g.set(x, y, z, "white_concrete"); continue; }                        // quoins
    if (y <= gr + 2) {                                                                  // shopfront
      if (isDoor(x, z)) {
        const half = y === gr + 1 ? "lower" : "upper";
        g.set(x, y, z, "dark_oak_door", { facing: "south", half, hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (pier) { g.set(x, y, z, "bricks"); continue; }
      if (y === gr + 2 && isLantern(x, z)) { g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" }); continue; }
      g.set(x, y, z, "glass_pane", paneState(x, z, ex));
      continue;
    }
    // upper windows
    if (pier) { g.set(x, y, z, "bricks"); continue; }
    if ((x * 7 + z * 3 + y) % 5 === 0) g.set(x, y, z, "glowstone");                    // a lit room
    else g.set(x, y, z, "glass_pane", paneState(x, z, ex));
  }
}

// rooftop plant: a 2x2 iron box on the main tier, standing on the roof slab
for (const [x, z] of [[5, 2], [6, 2], [5, 3], [6, 3]]) {
  if (get(x, z) && !exposed(x, z).length && roofAt(x, z) === 7) g.set(x, 7, z, "iron_block");
}

// a pane joins its neighbours along its own wall plane only
function paneState(x, z, ex) {
  const alongX = ex.some((d) => d === "N" || d === "S");
  const s = { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" };
  if (alongX) { if (isShell(x - 1, z)) s.west = "true"; if (isShell(x + 1, z)) s.east = "true"; }
  else { if (isShell(x, z - 1)) s.north = "true"; if (isShell(x, z + 1)) s.south = "true"; }
  return s;
}

const res = g.save(OUT);
console.log(`saved ${OUT}: ${res.blocks} blocks, palette ${res.palette}`);
