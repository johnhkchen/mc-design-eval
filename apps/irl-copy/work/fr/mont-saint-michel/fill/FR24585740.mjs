import { readFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR24585740";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 17, H = 33, D = 18;
const g = new Voxels([W, H, D]);

// Tour de la Liberté: a square granite-and-stone donjon. One smoothed roof level
// for the whole keep (lidar noise removed), four corner turrets rising three
// blocks above it, a battered granite plinth, string courses every storey,
// paired windows with stone surrounds, a crenellated parapet and a pointed
// doorway on the south face.
const key = (x, z) => `${x},${z}`;
const map = new Map();
const roofs = [];
for (const [x, z, gr, roof] of cells) {
  const G = Math.round(gr);
  map.set(key(x, z), { ground: G });
  roofs.push(Math.round(roof));
}
roofs.sort((a, b) => a - b);
const median = roofs[Math.floor(roofs.length / 2)];
const R0 = Math.min(Math.max(median, 12), H - 6); // main roof level, smoothed

const has = (x, z) => map.has(key(x, z));
const GRANITE = "granite";
const STONE = "stone_bricks";
const CARVED = "chiseled_stone_bricks";
const SLAB_BOT = { type: "bottom", waterlogged: "false" };

for (const k of map.keys()) {
  const [x, z] = k.split(",").map(Number);
  const { ground: G } = map.get(k);
  const n = has(x, z - 1), s = has(x, z + 1), w = has(x - 1, z), e = has(x + 1, z);
  const perim = !(n && s && w && e);
  const cornerCell = (!n || !s) && (!w || !e);
  const R = cornerCell ? Math.min(R0 + 3, H - 2) : R0; // turrets rise above the keep
  const idx = x + z;

  // Foundation in the rock up to this cell's ground
  for (let y = 0; y < G; y++) g.set(x, y, z, GRANITE);

  // Walls and interior floors
  for (let y = G; y <= R - 2; y++) {
    if (perim) {
      if (y === G) {
        g.set(x, y, z, GRANITE); // battered plinth course
      } else if (y % 5 === 0 || y % 5 === 4 || y % 5 === 1) {
        g.set(x, y, z, CARVED); // string courses and window head/sill rows
      } else if (cornerCell) {
        g.set(x, y, z, STONE);
      } else if (idx % 2 === 0) {
        // paired-window bay: glass pane with stone surround
        const alongX = !n || !s; // face runs east-west
        const props = alongX
          ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
          : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
        g.set(x, y, z, "glass_pane", props);
      } else {
        g.set(x, y, z, STONE);
      }
    } else {
      if (y === G || y % 5 === 0) g.set(x, y, z, "stone_brick_slab", SLAB_BOT);
    }
  }

  // Roof deck
  g.set(x, R - 1, z, STONE);

  // Crenellated parapet, merlons on alternating perimeter cells
  if (perim && (idx % 2 === 0)) g.set(x, R, z, STONE);
  // Corner turrets get a stone cap block with a central lantern-less finial
  if (cornerCell && !perim) g.set(x, R, z, STONE);

  // Warm light behind some windows, only into true interior cells
  if (perim && !cornerCell && idx % 2 === 0 && ((x * 3 + z * 5) % 3 === 0)) {
    let ix = x, iz = z;
    if (!n) iz = z + 1;
    else if (!s) iz = z - 1;
    else if (!w) ix = x + 1;
    else if (!e) ix = x - 1;
    if (has(ix, iz)) {
      const inner = !(has(ix, iz - 1) && has(ix, iz + 1) && has(ix - 1, iz) && has(ix + 1, iz));
      if (!inner) {
        for (let y = G + 2; y <= R - 2; y++) {
          if (y % 5 === 2 || y % 5 === 3) g.set(ix, y, iz, "glowstone");
        }
      }
    }
  }
}

// Entrance: south face, centred on x = 8, with a pointed-arch surround
let entrance = null;
for (const k of map.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (x === 8 && !has(x, z + 1)) entrance = { x, z, G: map.get(k).ground };
}
if (entrance) {
  const { x, z, G } = entrance;
  // three-wide, three-high opening
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = 0; dy <= 2; dy++) g.set(x + dx, G + dy, z, "air");
  }
  // pointed arch: stone voussoirs over the side columns, stepped in the centre
  g.set(x - 1, G + 3, z, "chiseled_stone_bricks");
  g.set(x + 1, G + 3, z, "chiseled_stone_bricks");
  g.set(x, G + 3, z, "stone_brick_stairs", { facing: "south", half: "bottom", shape: "straight", waterlogged: "false" });
  // oak door in the opening
  g.set(x, G, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, G + 1, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  // lantern hanging from the arch
  g.set(x, G + 2, z, "lantern", { hanging: "true", waterlogged: "false" });
}

const out = `${DIR}/${ID}.nbt`;
mkdirSync(dirname(out), { recursive: true });
g.save(out);
