import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw591075534";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 16, H = 16, D = 29;
const g = new Voxels([W, H, D]);

const clampG = (v) => Math.max(0, Math.min(10, Math.round(v)));
const ground = new Map();
for (const [x, z, gv] of cells) ground.set(`${x},${z}`, clampG(gv));
const has = (x, z) => ground.has(`${x},${z}`);
const isInterior = (x, z) => has(x, z) && has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1);

// Foundation: solid from y 0 up to each cell's ground.
for (const [x, z] of cells) {
  const gr = ground.get(`${x},${z}`);
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
}

function interior(x, z, gr) {
  // Floor slabs at ground, 2nd-storey and 3rd-storey levels; roof deck at y 14.
  g.set(x, gr, z, "stone");
  for (const b of [5, 10]) if (b > gr) g.set(x, b, z, "stone");
  if (14 > gr) g.set(x, 14, z, "gray_concrete");
  // Rooftop plant boxes on the deck.
  if (x % 5 === 2 && z % 8 === 4) g.set(x, 15, z, "iron_block");
}

const BANDS = [3, 4, 5, 9, 10, 14];

for (const [x, z] of cells) {
  const gr = ground.get(`${x},${z}`);
  const nW = has(x - 1, z), nE = has(x + 1, z), nN = has(x, z - 1), nS = has(x, z + 1);
  const missX = !nW || !nE;
  const missZ = !nN || !nS;

  if (!missX && !missZ) {
    interior(x, z, gr);
    continue;
  }

  const corner = missX && missZ;
  let pier = false, along = 0, dx = 0, dz = 0;
  if (corner) {
    pier = true;
  } else if (missX) {
    along = z;
    pier = z % 3 === 0;
    dx = !nW ? 1 : -1; // inward direction
  } else {
    along = x;
    pier = x % 3 === 0;
    dz = !nN ? 1 : -1; // inward direction
  }
  const door = !corner && !missX && !nN && x === 7;

  for (let y = gr; y <= 15; y++) {
    if (door && (y === gr || y === gr + 1)) {
      const half = y === gr ? "lower" : "upper";
      g.set(x, y, z, "dark_oak_door", {
        facing: "north", half, hinge: "left", open: "false", powered: "false",
      });
      continue;
    }
    let id;
    if (y === 15) id = "smooth_stone";                    // parapet cap
    else if (y === gr) id = "stone_bricks";               // base course
    else if (BANDS.includes(y)) id = y === 3 ? "smooth_stone" : "light_gray_concrete";
    else if (corner || pier) id = "white_concrete";       // tiled piers
    else id = "light_blue_stained_glass";                 // glazing
    g.set(x, y, z, id);
  }

  // Warm lamps standing inside the glazed storeys, behind every sixth window.
  if (!corner && !pier && !door && along % 6 === 1) {
    const ix = x + dx, iz = z + dz;
    if (isInterior(ix, iz)) {
      g.set(ix, 6, iz, "glowstone");
      g.set(ix, 11, iz, "glowstone");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
