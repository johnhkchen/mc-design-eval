import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542682858";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Low-rise Xinyi-era commercial block: two storeys of 5 blocks, white tiled
// facade with grey spandrels, stone base and cornice, parapet roof with plant.
const W = 13, H = 23, D = 10;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const exposed = (x, z) =>
  Object.keys(DIRS).filter((d) => {
    const [dx, dz] = DIRS[d];
    return !has(x + dx, z + dz);
  });

// Window pattern: single-sided wall cells, alternating along the face.
const isWin = (x, z, ex) =>
  ex.length === 1 && ((ex[0] === "north" || ex[0] === "south") ? x % 2 === 1 : z % 2 === 1);

// Entrance: single-sided cell nearest the middle of the frontage, preferring south.
let entryKey = null;
{
  let best = Infinity;
  for (const [x, z] of cells) {
    const ex = exposed(x, z);
    if (ex.length !== 1) continue;
    const score = Math.abs(x - 6) + (ex[0] === "south" ? 0 : 50);
    if (score < best) { best = score; entryKey = `${x},${z}`; }
  }
}

// Pass 1: foundation, floors, walls, windows, entrance, parapet.
for (const [x, z, gr] of cells) {
  const ex = exposed(x, z);

  // Foundation up to this cell's own ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone");

  if (ex.length === 0) {
    // Interior: floor slabs per storey and a roof deck, air between.
    g.set(x, gr, z, "smooth_stone");
    g.set(x, gr + 5, z, "smooth_stone");
    g.set(x, gr + 10, z, "light_gray_concrete");
    continue;
  }

  const isCorner = ex.length >= 2;
  const isEntry = `${x},${z}` === entryKey;
  const win = !isEntry && !isCorner && isWin(x, z, ex);
  const face = ex[0];
  const paneProps = (face === "north" || face === "south")
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

  // Base course, storey lines, cornice and parapet.
  g.set(x, gr + 0, z, "stone_bricks");
  g.set(x, gr + 4, z, "light_gray_concrete");
  g.set(x, gr + 5, z, "light_gray_concrete");
  g.set(x, gr + 9, z, "light_gray_concrete");
  g.set(x, gr + 10, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
  g.set(x, gr + 11, z, "white_concrete");

  // Storey bands: ground (rel 1..3) and upper (rel 6..8).
  for (const [lo, hi, isGround] of [[1, 3, true], [6, 8, false]]) {
    for (let rel = lo; rel <= hi; rel++) {
      const y = gr + rel;
      if (isEntry) {
        if (rel === 1) g.set(x, y, z, "dark_oak_door", { facing: face, half: "lower", hinge: "left", open: "false", powered: "false" });
        else if (rel === 2) g.set(x, y, z, "dark_oak_door", { facing: face, half: "upper", hinge: "left", open: "false", powered: "false" });
        else if (rel === 3) g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
        else g.set(x, y, z, "white_concrete");
      } else if (win) {
        if (isGround) g.set(x, y, z, "tinted_glass");
        else g.set(x, y, z, "cyan_stained_glass_pane", paneProps);
      } else {
        g.set(x, y, z, "white_concrete");
      }
    }
  }
}

// Pass 2: warm lights behind some windows, inside the building.
for (const [x, z, gr] of cells) {
  const ex = exposed(x, z);
  if (ex.length !== 1) continue;
  if (!isWin(x, z, ex)) continue;
  if ((x + z) % 4 !== 1) continue;
  const [dx, dz] = DIRS[ex[0]];
  const ix = x - dx, iz = z - dz;
  if (!has(ix, iz) || exposed(ix, iz).length !== 0) continue;
  const igr = ground.get(`${ix},${iz}`);
  g.set(ix, igr + 2, iz, "glowstone");
  g.set(ix, igr + 7, iz, "glowstone");
}

// Pass 3: roof plant on the deck, and a lightning rod near the centre.
let rodKey = null;
{
  let best = Infinity;
  for (const [x, z, gr] of cells) {
    if (exposed(x, z).length !== 0) continue;
    const d = Math.abs(x - 6) + Math.abs(z - 5);
    if (d < best) { best = d; rodKey = `${x},${z}`; }
  }
}
for (const [x, z, gr] of cells) {
  if (exposed(x, z).length !== 0) continue;
  if (`${x},${z}` === rodKey) {
    g.set(x, gr + 11, z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  } else if ((x * 3 + z * 5) % 7 === 0) {
    g.set(x, gr + 11, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
