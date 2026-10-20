import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540888781";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 13, H = 23, D = 16;
const g = new Voxels([W, H, D]);

// Two-storey Xinyi-era commercial block: white/quartz concrete with tiled bands,
// glass curtain-style window bays, a stone cornice and a flat roof at about y=11.
const ROOF = 10;               // cornice/parapet block row; roof surface at y=11
const SHOP_TOP = 3;            // shopfront runs above ground floor base course
const BAND_LINES = [4, 5, 9];  // sill/floor slab/lintel lines in quartz

const key = (x, z) => `${x},${z}`;
const inFp = new Set(cells.map(([x, z]) => key(x, z)));
const has = (x, z) => inFp.has(key(x, z));
const gnd = new Map(cells.map(([x, z, h]) => [key(x, z), Math.max(0, Math.min(h, 4))]));

const minZ = Math.min(...cells.map(([, z]) => z));
const frontCells = cells.filter(([, z]) => z === minZ).map(([x]) => x).sort((a, b) => a - b);
const doorX = frontCells[Math.floor(frontCells.length / 2)];

function exposed(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push("N");
  if (!has(x, z + 1)) f.push("S");
  if (!has(x - 1, z)) f.push("W");
  if (!has(x + 1, z)) f.push("E");
  return f;
}

for (const [x, z] of cells) {
  const gr = gnd.get(key(x, z));

  // Foundation: solid up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const faces = exposed(x, z);

  if (faces.length === 0) {
    // Interior: floor slabs and roof deck; air gap otherwise.
    g.set(x, gr, z, "smooth_stone");
    g.set(x, 5, z, "smooth_stone");
    g.set(x, ROOF, z, "gray_concrete");
    // Rooftop AC plant, sparse.
    if ((x * 3 + z * 5) % 11 === 0 && x > 2 && x < W - 3 && z > 3 && z < D - 4) {
      g.set(x, ROOF + 1, z, "iron_block");
    }
    continue;
  }

  const corner = faces.length >= 2;
  const face = faces[0];
  const t = face === "N" || face === "S" ? x : z;
  const isFront = z === minZ && faces.includes("N");

  for (let y = gr; y <= ROOF; y++) {
    // Base course, cornice and storey bands.
    if (y === gr) { g.set(x, y, z, "polished_granite"); continue; }
    if (y === ROOF) { g.set(x, y, z, "stone_bricks"); continue; }

    // Front ground floor: shopfront glass with door and lantern.
    if (isFront && y >= gr + 1 && y <= gr + SHOP_TOP && !corner) {
      if (x === doorX) {
        if (y === gr + 1) {
          g.set(x, y, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
        } else if (y === gr + 2) {
          g.set(x, y, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
        } else {
          g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
        }
      } else if (t % 3 === 0) {
        g.set(x, y, z, "smooth_quartz");
      } else {
        g.set(x, y, z, "light_blue_stained_glass");
      }
      continue;
    }

    if (BAND_LINES.includes(y)) { g.set(x, y, z, "smooth_quartz"); continue; }

    if (corner) { g.set(x, y, z, "smooth_quartz"); continue; }

    if (t % 3 === 1) {
      const horiz = face === "N" || face === "S"
        ? { north: "false", south: "false", east: "true", west: "true" }
        : { north: "true", south: "true", east: "false", west: "false" };
      g.set(x, y, z, "glass_pane", { ...horiz, waterlogged: "false" });
    } else if (t % 3 === 0) {
      g.set(x, y, z, "smooth_quartz");
    } else {
      g.set(x, y, z, "white_concrete");
    }
  }

  // Warm lights behind a few upper-floor windows, in the interior cell just inside.
  if (!isFront && t % 6 === 1 && y_ok(gr)) {
    const dir = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] }[face];
    const nx = x + dir[0], nz = z + dir[1];
    if (has(nx, nz) && exposed(nx, nz).length === 0) {
      g.set(nx, 7, nz, "shroomlight");
    }
  }
}

function y_ok(gr) { return gr <= 4; }

g.save(`${DIR}/${ID}.nbt`);
