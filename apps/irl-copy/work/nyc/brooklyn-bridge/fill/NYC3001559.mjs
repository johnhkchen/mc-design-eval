import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC3001559.cells.json`, "utf8"));

const W = 6, H = 23, D = 10;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const inFoot = new Set(cells.map(([x, z]) => key(x, z)));
const has = (x, z) => inFoot.has(key(x, z));

function exposed(x, z) {
  return { n: !has(x, z - 1), s: !has(x, z + 1), w: !has(x - 1, z), e: !has(x + 1, z) };
}

const B = Math.min(...cells.map(c => c[2]));
const roofs = cells.map(c => c[3]).sort((a, b) => a - b);
const rfMed = roofs[Math.floor(roofs.length / 2)];
const nStoreys = Math.min(4, Math.max(2, Math.floor((rfMed - B - 1) / 3)));
const top = Math.min(H - 5, B + 3 * nStoreys);

// Front door: centred on the street (north, low-z) face
const northCells = cells.filter(([x, z]) => exposed(x, z).n).sort((a, b) => a[0] - b[0]);
const midX = northCells.length
  ? (northCells[0][0] + northCells[northCells.length - 1][0]) / 2
  : -1;
const doorCell = northCells.length
  ? northCells.reduce((best, c) => (Math.abs(c[0] - midX) < Math.abs(best[0] - midX) ? c : best))
  : null;
const dx = doorCell ? doorCell[0] : -1;
const dz = doorCell ? doorCell[1] : -1;

const GLASS_NS = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
const GLASS_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const [x, z, gr] of cells) {
  const ex = exposed(x, z);
  const ne = (ex.n ? 1 : 0) + (ex.s ? 1 : 0) + (ex.w ? 1 : 0) + (ex.e ? 1 : 0);
  const edge = ne > 0;

  // Foundation
  for (let y = 0; y < Math.min(gr, H); y++) {
    g.set(x, y, z, "stone_bricks");
  }

  // Walls, floors, cornice, parapet, roof
  for (let y = gr; y <= top + 1 && y < H; y++) {
    const rel = y - B;

    // Parapet course above the cornice, on the outside edge only
    if (y === top + 1) {
      if (edge) g.set(x, y, z, "stone_bricks");
      continue;
    }

    // Roof deck / cornice
    if (y === top) {
      g.set(x, y, z, edge ? "smooth_stone" : "stone_bricks");
      continue;
    }

    // Storey string courses (outside) and floor slabs (inside)
    if (rel % 3 === 0) {
      g.set(x, y, z, "smooth_stone");
      continue;
    }

    // Interior: air, with warm light behind some glass
    if (!edge) {
      if (rel % 3 === 1 && (x + z) % 3 === 0) {
        g.set(x, y, z, "glowstone");
      }
      continue;
    }

    // Corner pilasters
    if (ne >= 2) {
      g.set(x, y, z, "stone_bricks");
      continue;
    }

    const onNS = ex.n || ex.s;
    const idx = onNS ? x : z;

    // Entrance: door on the centre of the street face, rows rel 1 and 2
    if (ex.n && x === dx && z === dz && (rel === 1 || rel === 2)) {
      g.set(x, y, z, "dark_oak_door", {
        facing: "north",
        half: rel === 1 ? "lower" : "upper",
        hinge: "right",
        open: "false",
        powered: "false",
      });
      continue;
    }

    // Window bays with white sill at the bottom of each opening
    if (rel % 3 === 1 && idx % 2 === 1) {
      g.set(x, y, z, "white_concrete");
      continue;
    }
    if (rel % 3 === 2 && idx % 2 === 1) {
      g.set(x, y, z, "glass_pane", onNS ? GLASS_NS : GLASS_EW);
      continue;
    }

    g.set(x, y, z, "bricks");
  }

  // Chimney on one interior cell
  if (x === 1 && z === 2) {
    for (let y = top + 2; y <= Math.min(top + 3, H - 1); y++) {
      g.set(x, y, z, "bricks");
    }
  }
}

g.save(`${DIR}/NYC3001559.nbt`);
