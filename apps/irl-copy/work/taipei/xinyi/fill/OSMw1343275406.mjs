import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1343275406";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([10, 19, 9]);

// Footprint lookup: "x,z" -> lowest-ground value of that cell
const key = (x, z) => `${x},${z}`;
const ground = new Map(cells.map(([x, z, gr]) => [key(x, z), gr]));
const has = (x, z) => ground.has(key(x, z));

// Exposure of a cell: which sides border outside the footprint
const exposure = (x, z) => ({
  mW: !has(x - 1, z),
  mE: !has(x + 1, z),
  mN: !has(x, z - 1),
  mS: !has(x, z + 1),
});

// Front door: north-facing edge cell (not a corner) with the smallest x
let doorCell = null;
for (const [x, z] of cells) {
  const e = exposure(x, z);
  const corner = (e.mW || e.mE) && (e.mN || e.mS);
  if (e.mN && !corner) {
    if (!doorCell || x < doorCell[0]) doorCell = [x, z];
  }
}

const glassPane = (x, z) => {
  const e = exposure(x, z);
  // Pane connects along the wall it sits in
  if (e.mN || e.mS) {
    return { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
  }
  return { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
};

// Pass 1: structure, walls, roof
for (const [x, z, gr] of cells) {
  const e = exposure(x, z);
  const edge = e.mW || e.mE || e.mN || e.mS;
  const corner = (e.mW || e.mE) && (e.mN || e.mS);

  // Foundation under everything, solid up to the cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  if (!edge) {
    // Interior: floor slab, air storey, roof deck, optional roof plant
    g.set(x, gr, z, "smooth_stone");
    // gr+1..gr+3 left as air (storey void)
    g.set(x, gr + 4, z, "light_gray_concrete");
    if ((x * 2 + z * 3) % 9 === 0) {
      g.set(x, gr + 5, z, "iron_block");
    }
    continue;
  }

  // Edge cells: base course, shopfront walls, cornice, parapet
  g.set(x, gr, z, "stone_bricks");

  if (corner) {
    for (let y = gr + 1; y <= gr + 6; y++) g.set(x, y, z, "white_concrete");
    continue;
  }

  const p = x + z;
  const isDoor = doorCell && doorCell[0] === x && doorCell[1] === z;

  if (isDoor) {
    g.set(x, gr + 1, z, "oak_door", {
      facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
    });
    g.set(x, gr + 2, z, "oak_door", {
      facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
    });
  } else if (p % 3 === 0) {
    // Mullion / pillar
    g.set(x, gr + 1, z, "white_concrete");
    g.set(x, gr + 2, z, "white_concrete");
  } else {
    g.set(x, gr + 1, z, "glass_pane", glassPane(x, z));
    g.set(x, gr + 2, z, "glass_pane", glassPane(x, z));
  }

  // Transom band
  g.set(x, gr + 3, z, "white_concrete");
  // Cornice
  g.set(x, gr + 4, z, "smooth_stone");
  // Parapet with stone cap
  g.set(x, gr + 5, z, "white_concrete");
  g.set(x, gr + 6, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

// Pass 2: warm light just inside some shopfront windows
for (const [x, z, gr] of cells) {
  const e = exposure(x, z);
  const edge = e.mW || e.mE || e.mN || e.mS;
  const corner = (e.mW || e.mE) && (e.mN || e.mS);
  if (!edge || corner) continue;
  if ((x + z) % 4 !== 1) continue;
  if (doorCell && doorCell[0] === x && doorCell[1] === z) continue;

  let ix = x, iz = z;
  if (e.mN) iz = z + 1;
  else if (e.mS) iz = z - 1;
  else if (e.mW) ix = x + 1;
  else if (e.mE) ix = x - 1;

  if (!has(ix, iz)) continue;
  const inner = exposure(ix, iz);
  if (inner.mW || inner.mE || inner.mN || inner.mS) continue;
  g.set(ix, gr + 1, iz, "glowstone");
}

g.save(`${DIR}/${ID}.nbt`);
