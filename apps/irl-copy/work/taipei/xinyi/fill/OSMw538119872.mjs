import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538119872";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 9, H = 23, D = 27;
const g = new Voxels([W, H, D]);

// Footprint lookup
const F = new Set();
for (const [x, z] of cells) F.add(`${x},${z}`);
const has = (x, z) => F.has(`${x},${z}`);

// Body base sits on the highest cell ground so every storey is level;
// the plinth below fills solid from y 0 under every cell.
const B = Math.max(...cells.map((c) => c[2]));

const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Outward directions [dx, dz]
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const exposed = (x, z) => DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));

const facingOf = ([dx, dz]) =>
  dx === 1 ? "east" : dx === -1 ? "west" : dz === 1 ? "south" : "north";

// Choose the entrance: a street-facing (-z) exposed cell nearest the middle of the frontage.
const midX = (W - 1) / 2;
let doorCell = null;
let best = Infinity;
for (const [x, z] of cells) {
  const ex = exposed(x, z);
  const front = ex.find(([dx, dz]) => dz === -1);
  if (!front) continue;
  const score = Math.abs(x - midX) + z * 0.01;
  if (score < best) {
    best = score;
    doorCell = { x, z, dir: front };
  }
}
if (!doorCell) {
  for (const [x, z] of cells) {
    const ex = exposed(x, z);
    if (ex.length) { doorCell = { x, z, dir: ex[0] }; break; }
  }
}

// Foundation plinth: solid from y 0 up to the body base under every footprint cell.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < Math.max(B, gr); y++) {
    put(x, y, z, "stone_bricks");
  }
}

// Body: storeys of 5 blocks, two storeys, parapet, roof at B+10.
for (const [x, z] of cells) {
  const ex = exposed(x, z);
  const isWall = ex.length > 0;
  const corner = ex.length > 1;

  for (let r = 0; r <= 11; r++) {
    const y = B + r;

    // Floor slabs and roof slab span the whole footprint.
    if (r === 5 || r === 10) {
      put(x, y, z, "light_gray_concrete");
      continue;
    }
    if (!isWall) {
      // Roof equipment on the interior roof (interior cells only).
      if (r === 11 && x >= 2 && x <= 6 && z >= 9 && z <= 13) {
        if ((x + z) % 2 === 0) put(x, y, z, "light_gray_concrete");
        else if (x === 4 && z === 11) put(x, y, z, "iron_block");
      }
      if (r === 12 && x === 4 && z === 11) put(x, y, z, "iron_block");
      continue;
    }

    // Exterior wall cell. Along-face coordinate drives pilaster rhythm.
    const along = ex.some(([dx]) => dx !== 0) ? z : x;
    const pilaster = corner || along % 3 === 0;

    if (r === 11) {
      put(x, y, z, "white_concrete");
      continue;
    }

    if (r === 0) {
      put(x, y, z, "polished_andesite");
    } else if (r === 4) {
      put(x, y, z, "light_gray_concrete");
    } else if (r === 9) {
      put(x, y, z, "light_gray_concrete");
    } else if (r === 1 || r === 2 || r === 3 || r === 6 || r === 7 || r === 8) {
      // Window bands
      const isEntranceCell =
        doorCell && doorCell.x === x && doorCell.z === z && (r === 1 || r === 2);
      if (isEntranceCell) {
        const half = r === 1 ? "lower" : "upper";
        put(x, y, z, "dark_oak_door", {
          facing: facingOf(doorCell.dir),
          half,
          hinge: "left",
          open: "false",
          powered: "false",
        });
      } else if (pilaster) {
        put(x, y, z, r <= 3 ? "smooth_quartz" : "white_concrete");
      } else {
        put(x, y, z, "cyan_stained_glass_pane");
      }
    }

    // Warm light behind some glass: glowstone on the interior neighbour.
    if (
      !pilaster &&
      (r === 2 || r === 7) &&
      (x * 7 + z * 3 + r) % 5 === 0
    ) {
      const [dx, dz] = ex[0];
      const ix = x - dx;
      const iz = z - dz;
      if (has(ix, iz) && exposed(ix, iz).length === 0) {
        put(ix, y, iz, "glowstone");
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
