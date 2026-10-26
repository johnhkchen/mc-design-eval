// FR245184471: a Haussmann-era residential block (1875, seven storeys) on the lidar footprint, in cream limestone under a
// grey zinc-look roof. Storeys are 4 blocks (a course, two window rows, a lintel), so every tier top (4, 8, ... 28) lands on
// a storey line and the lidar's 28-block roof is the seventh storey's parapet. Lower wings step down the L as setbacks.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR245184471.cells.json`, "utf8"));

const X = 22, Z = 16, H = 44;
const TIERS = [4, 8, 12, 16, 20, 24, 28];          // storey tops: 1 to 7 storeys
const WALL = "smooth_quartz", COURSE = "stone_bricks", ROOF = "deepslate_tiles", FLOOR = "spruce_planks";
const CHIMNEY = [[4, 5], [10, 5], [4, 10], [10, 10]];
const DOOR_X = 7;                                   // the street entrance, middle of the north face

const fp = new Map();                               // "x,z" -> { g, lidar, T }
for (const [x, z, g, r] of cells) fp.set(`${x},${z}`, { g, lidar: r, T: 0 });
const at = (x, z) => fp.get(`${x},${z}`);
const topAt = (x, z) => at(x, z)?.T ?? 0;          // no building beside the edge: top 0, so the face is open
const NEI = [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]];

// Smooth the lidar: 3x3 median, then snap to the nearest storey tier (kills the noisy edge cells and the stepped roof).
for (const [key, c] of fp) {
  const [x, z] = key.split(",").map(Number);
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = at(x + dx, z + dz); if (n) vals.push(n.lidar); }
  vals.sort((a, b) => a - b);
  const med = vals[Math.floor(vals.length / 2)];
  c.T = TIERS.reduce((best, t) => (Math.abs(t - med) < Math.abs(best - med) ? t : best));
}
// Then a majority pass over each cell and its four neighbours: a lone cell that snapped a tier off its block joins the block,
// so each setback is a clean edge rather than a stair of single blocks.
const snapped = new Map([...fp].map(([k, c]) => [k, c.T]));
for (const [key, c] of fp) {
  const [x, z] = key.split(",").map(Number);
  const votes = [snapped.get(key), ...NEI.map(([, dx, dz]) => snapped.get(`${x + dx},${z + dz}`)).filter((t) => t !== undefined)];
  const count = new Map();
  for (const t of votes) count.set(t, (count.get(t) ?? 0) + 1);
  c.T = [...count].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0][0];
}

// A cell's exposed faces at height y (a neighbour that does not reach that row, or the edge of the footprint). The face
// onto the outside world, if any, is the windowed one; a face onto a lower wing or a shorter tier is a blank party wall.
const exposedFaces = (x, z, y) => NEI.filter(([, dx, dz]) => topAt(x + dx, z + dz) <= y);
const streetFace = (x, z, y) => exposedFaces(x, z, y).find(([, dx, dz]) => !at(x + dx, z + dz))?.[0] ?? null;

const glassState = (face) => (face === "north" || face === "south"
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

const g = new Voxels([X, H, Z]);

for (const [key, c] of fp) {
  const [x, z] = key.split(",").map(Number), T = c.T;
  g.set(x, 0, z, COURSE);                           // the ground storey's floor and base course: solid from the ground up

  for (let y = 1; y < T; y++) {
    const exposed = exposedFaces(x, z, y).length > 0, face = streetFace(x, z, y);
    if (exposed) {
      const row = y % 4, idx = face === "north" || face === "south" ? x : z;
      if (y === T - 1) g.set(x, y, z, COURSE);      // parapet on the roof line
      else if (row === 0) g.set(x, y, z, COURSE);   // string course at each storey's foot
      else if (!face || row === 3) g.set(x, y, z, WALL); // blank party wall onto a lower tier, and the lintel band
      else if (idx % 3 === 0) g.set(x, y, z, WALL); // stone pier between window bays
      else if (row === 1 && (idx + y / 4) % 5 === 0) g.set(x, y, z, "glowstone"); // a lit room
      else g.set(x, y, z, "glass_pane", glassState(face));
    } else if (y % 4 === 0 && y <= T - 2) {
      g.set(x, y, z, FLOOR);                        // a floor slab per storey, spanning the walls
    } else if (y === T - 1) {
      g.set(x, y, z, ROOF);                         // the roof deck over the rooms
    }
  }
}

// Chimneys on the seventh storey's roof, each a stone stack with a cap.
for (const [x, z] of CHIMNEY) {
  if (topAt(x, z) !== TIERS[TIERS.length - 1]) continue;
  g.set(x, 28, z, WALL); g.set(x, 29, z, WALL);
  g.set(x, 30, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// The entrance: a dark oak door on the north face, with a lit fanlight over it.
const doorState = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
g.set(DOOR_X, 0, 0, "dark_oak_door", doorState("lower"));
g.set(DOOR_X, 1, 0, "dark_oak_door", doorState("upper"));
g.set(DOOR_X, 2, 0, "glowstone");

const stats = g.save(`${DIR}/FR245184471.nbt`);
console.log(`FR245184471.nbt: ${stats.blocks} blocks, ${stats.palette} palette entries`);
