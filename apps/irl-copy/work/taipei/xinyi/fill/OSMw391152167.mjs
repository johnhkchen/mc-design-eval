import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw391152167";
const W = 9, H = 24, D = 23;
const ROOF = 12; // roof top sits at y = 12 above lowest ground

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, Math.min(Math.max(Math.round(gr), 0), ROOF - 1));
}
const has = (x, z) => ground.has(`${x},${z}`);

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Storey datum (absolute y): ground storey gr..4, upper storey 5..9, parapet 10..11.
const STOREY_LINE_A = 4;
const FLOOR_2 = 5;
const STOREY_LINE_B = 9;
const DECK = 10;
const PARAPET_TOP = 11;

// Entrance: lowest-z (north) face, nearest the middle of the width.
const cx = (W - 1) / 2;
let entrance = null;
{
  let best = Infinity;
  for (const [key] of ground) {
    const [x, z] = key.split(",").map(Number);
    if (has(x, z - 1)) continue;
    const d = Math.abs(x - cx);
    if (d < best) { best = d; entrance = { x, z }; }
  }
  if (!entrance) {
    const [key] = ground.keys();
    const [x, z] = key.split(",").map(Number);
    entrance = { x, z };
  }
}

// Penthouse / plant room footprint on the roof (interior cells only).
const plant = (x, z) => x >= 5 && x <= 6 && z >= 15 && z <= 17;

for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const missN = !has(x, z - 1);
  const missS = !has(x, z + 1);
  const missW = !has(x - 1, z);
  const missE = !has(x + 1, z);
  const zFace = missN || missS;
  const xFace = missW || missE;
  const edge = zFace || xFace;

  if (!edge) {
    // Interior: floor slabs, roof deck, air gap behind glass, warm light.
    for (const fy of [gr, FLOOR_2, DECK]) {
      if (fy >= gr && fy <= DECK) put(x, fy, z, "smooth_stone");
    }
    if (x % 3 === 1 && z % 4 === 1) put(x, 7, z, "glowstone");
    if (x % 3 === 1 && z % 4 === 3) put(x, 2, z, "shroomlight");
    // Rooftop units and a plant room on the deck.
    if ((x === 2 || x === 3) && (z === 4 || z === 5)) {
      put(x, PARAPET_TOP, z, "iron_block");
    }
    if (plant(x, z)) {
      put(x, PARAPET_TOP, z, "stone_bricks");
    }
    continue;
  }

  // Facade: piers at bay lines and at corners (read as quoins/pilasters).
  const pierX = zFace && x % 3 === 0;
  const pierZ = xFace && z % 3 === 0;
  const corner = zFace && xFace;
  const pier = pierX || pierZ || corner;

  const isEntrance = entrance && entrance.x === x && entrance.z === z;
  const facing = missN ? "north" : missS ? "south" : missW ? "west" : "east";

  for (let y = gr; y <= PARAPET_TOP; y++) {
    if (y === PARAPET_TOP) {
      // Coping: slab cap over the parapet, with a half-height lip on the piers.
      put(x, y, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
      continue;
    }
    if (y === DECK) {
      put(x, y, z, "smooth_quartz");
      continue;
    }
    if (y === gr) {
      put(x, y, z, "polished_andesite"); // base course
      continue;
    }
    if (y === STOREY_LINE_A || y === FLOOR_2 || y === STOREY_LINE_B) {
      // Storey lines: quartz on piers, terracotta between, so each bay reads.
      put(x, y, z, pier ? "quartz_pillar" : "white_terracotta", pier ? { axis: "y" } : undefined);
      continue;
    }

    // Entrance: double door, glazed transom, dark lintel canopy.
    if (isEntrance && (y === gr + 1 || y === gr + 2)) {
      put(x, y, z, "dark_oak_door", {
        facing,
        half: y === gr + 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }
    if (isEntrance && y === gr + 3) {
      put(x, y, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
      continue;
    }

    const windowRow = (y > gr && y <= 3) || (y >= 6 && y <= 8);
    if (!windowRow) {
      put(x, y, z, pier ? "quartz_pillar" : "white_terracotta", pier ? { axis: "y" } : undefined);
      continue;
    }

    if (pier) {
      put(x, y, z, "quartz_pillar", { axis: "y" });
    } else if (zFace) {
      put(x, y, z, "gray_stained_glass_pane", {
        north: "false", south: "false", east: "true", west: "true", waterlogged: "false",
      });
    } else {
      put(x, y, z, "gray_stained_glass_pane", {
        north: "true", south: "true", east: "false", west: "false", waterlogged: "false",
      });
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
