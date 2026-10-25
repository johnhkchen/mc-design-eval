import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499455";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 11, H = 19, D = 13;
const MAXX = 10, MAXZ = 12;
const g = new Voxels([W, H, D]);

const cell = new Map();
for (const c of cells) cell.set(`${c[0]},${c[1]}`, c);
const has = (x, z) => cell.has(`${x},${z}`);
const isExt = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Smooth lidar noise: one roof height for the whole block, per-cell ground for foundations
const roofs = cells.map(c => Math.round(c[3])).sort((a, b) => a - b);
const roofMedian = roofs[Math.floor(roofs.length / 2)];
const ROOF = Math.min(H - 1, Math.max(6, roofMedian));

function massing(c) {
  const ground = Math.max(0, Math.round(c[2]));
  const roof = Math.min(H - 1, Math.max(ground + 5, ROOF));
  let eave = Math.max(ground + 4, roof - 3);
  if (eave > roof - 1) eave = roof - 1;
  const rise = Math.max(1, roof - eave);
  return { ground, eave, rise };
}

// Pass 1: foundation, walls, ceilings, roof
for (const c of cells) {
  const [x, z] = c;
  const { ground, eave, rise } = massing(c);
  const ext = isExt(x, z);

  for (let y = 0; y <= ground; y++) g.set(x, y, z, "stone_bricks");

  if (ext) {
    g.set(x, ground + 1, z, "stone_bricks");
    for (let y = ground + 2; y < eave; y++) g.set(x, y, z, "spruce_planks");
    g.set(x, eave, z, "spruce_planks");
  } else {
    g.set(x, eave, z, "smooth_stone");
  }

  // Gable roof running along z: slope falls toward both x edges
  const xd = Math.min(x, MAXX - x);
  const h = Math.min(H - 1, eave + Math.min(xd + 1, rise));
  for (let y = eave + 1; y < h; y++) g.set(x, y, z, "deepslate_tiles");
  if (h > eave) {
    if (xd + 1 < rise && x !== 5) {
      g.set(x, h, z, "deepslate_tile_stairs", {
        facing: x < 5 ? "west" : "east", half: "bottom", shape: "straight", waterlogged: "false",
      });
    } else {
      g.set(x, h, z, "deepslate_tiles");
    }
  }
}

// Pass 2: facade articulation on exposed faces
const faces = [
  { dx: 0, dz: -1 },
  { dx: 0, dz: 1 },
  { dx: -1, dz: 0 },
  { dx: 1, dz: 0 },
];

for (const c of cells) {
  const [x, z] = c;
  if (!isExt(x, z)) continue;
  const { ground, eave } = massing(c);

  for (const f of faces) {
    if (has(x + f.dx, z + f.dz)) continue;
    const onZFace = f.dz !== 0;
    const k = onZFace ? x : z;
    const last = onZFace ? MAXX : MAXZ;
    const pillar = k === 0 || k === last || k % 3 === 0;

    if (pillar) {
      for (let y = ground + 2; y < eave; y++) {
        g.set(x, y, z, "stripped_spruce_log", { axis: "y" });
      }
      continue;
    }

    const paneProps = onZFace
      ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
    for (let y = ground + 2; y <= Math.min(ground + 3, eave - 1); y++) {
      g.set(x, y, z, "glass_pane", paneProps);
    }

    if (k % 6 === 2) {
      const ix = x - f.dx, iz = z - f.dz;
      if (has(ix, iz)) g.set(ix, ground + 2, iz, "glowstone");
    }
  }
}

// Pass 3: entrance on the street (north, z-minimum) face, nearest to centre
{
  let best = null;
  for (const c of cells) {
    const [x, z] = c;
    if (z !== 0 || has(x, z - 1)) continue;
    if (!best || Math.abs(x - 5) < Math.abs(best[0] - 5)) best = c;
  }
  if (best) {
    const [dx, dz] = [best[0], best[1]];
    const { ground, eave } = massing(best);
    g.set(dx, ground + 1, dz, "oak_door", {
      facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
    });
    g.set(dx, ground + 2, dz, "oak_door", {
      facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
    });
    if (ground + 3 < eave) {
      g.set(dx, ground + 3, dz, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
