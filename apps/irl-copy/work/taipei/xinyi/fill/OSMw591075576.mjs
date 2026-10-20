import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw591075576";

// Footprint cells: [x, z, ground]. Ground is the y of the lowest block under that cell.
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Record-less building, read as a 1980s-90s Taipei mid-rise: three storeys of
// 4 blocks each, white tiled concrete piers, pale spandrels, blue-glass shopfront
// at street level, and a parapet capping the roof 13 blocks above lowest ground.
const W = 23, H = 25, D = 18;
const STOREYS = 3;
const STOREY_H = 4;
const PARAPET_Y = 12; // roof/parapet layer, relative to each cell's ground

const ground = new Map();
for (const [x, z, gd] of cells) ground.set(`${x},${z}`, gd);
const inF = (x, z) => ground.has(`${x},${z}`);

const g = new Voxels([W, H, D]);

// Pane connections: a pane on a north/south face joins east-west, one on an east/west face joins north-south.
const paneNS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const paneEW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Entrance: centre-most south-facing edge cell on the ground storey.
const southCells = cells
  .filter(([x, z]) => !inF(x, z + 1))
  .map(([x]) => x)
  .sort((a, b) => a - b);
const entranceX = southCells.length ? southCells[Math.floor(southCells.length / 2)] : -1;
const entranceZ = Math.max(...cells.filter(([x]) => x === entranceX).map(([, z]) => z));

for (const [x, z, gd] of cells) {
  // Foundation fill from y 0 up to this cell's ground.
  for (let y = 0; y < gd; y++) g.set(x, y, z, "stone_bricks");

  const N = !inF(x, z - 1);
  const S = !inF(x, z + 1);
  const Wf = !inF(x - 1, z);
  const E = !inF(x + 1, z);
  const edge = N || S || Wf || E;
  const corner = (N || S) && (Wf || E);
  const pillarNS = (N || S) && x % 3 === 0;
  const pillarEW = (Wf || E) && z % 3 === 0;
  const pillar = corner || pillarNS || pillarEW;

  // Which face a window cell looks out of (for pane orientation and glow placement).
  const faceNS = N || S;
  const inward = N ? [0, 1] : S ? [0, -1] : Wf ? [1, 0] : [-1, 0];

  for (let s = 0; s < STOREYS; s++) {
    const b = gd + s * STOREY_H;

    // Storey line / floor slab at the bottom of each storey.
    if (edge) {
      g.set(x, b, z, s === 0 ? "stone_bricks" : "light_gray_concrete");
    } else {
      g.set(x, b, z, "smooth_stone");
    }

    if (!edge) {
      // Interior: air gap behind the glass, no interior fit-out.
      continue;
    }

    const isEntranceCell = s === 0 && x === entranceX && z === entranceZ && S;

    // Two-high window or pier zone.
    for (let dy = 1; dy <= 2; dy++) {
      const y = b + dy;
      if (isEntranceCell) {
        // Leave the doorway open.
        continue;
      }
      if (pillar) {
        g.set(x, y, z, "white_concrete");
      } else if (s === 0) {
        g.set(x, y, z, "light_blue_stained_glass_pane", faceNS ? paneNS : paneEW);
      } else {
        g.set(x, y, z, "light_blue_stained_glass_pane", faceNS ? paneNS : paneEW);
      }
    }

    // Spandrel band under each window row.
    g.set(x, b + 3, z, "light_gray_concrete");

    // Warm light behind some upper-storey windows.
    if (!pillar && s >= 1 && (x + z + s) % 4 === 0) {
      const ix = x + inward[0], iz = z + inward[1];
      if (inF(ix, iz)) g.set(ix, b + 1, iz, "glowstone");
    }
  }

  // Parapet on edges, roof slab inside.
  const roofY = gd + PARAPET_Y;
  g.set(x, roofY, z, edge ? "light_gray_concrete" : "gray_concrete");

  // Roof plant: a few mechanical units on interior roof cells.
  if (!edge && x % 6 === 3 && z % 5 === 2 && roofY + 1 < H) {
    g.set(x, roofY + 1, z, "iron_block");
  }
}

// Entrance: lantern hanging inside the doorway, under the spandrel above.
if (entranceX >= 0 && inF(entranceX, entranceZ)) {
  const gd = ground.get(`${entranceX},${entranceZ}`);
  g.set(entranceX, gd + 2, entranceZ, "lantern", { hanging: "true", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
