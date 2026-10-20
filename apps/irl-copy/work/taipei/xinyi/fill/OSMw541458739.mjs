import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541458739";
const W = 21, H = 23, D = 15;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup and ground heights
const ground = new Map();
const k = (x, z) => `${x},${z}`;
for (const [x, z, gr] of cells) ground.set(k(x, z), Math.round(gr));
const has = (x, z) => ground.has(k(x, z));
const lowest = Math.min(...ground.values());

const put = (x, y, z, id, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Glass pane connection props: panes along x (front/back walls) or along z (side walls)
const pane = (alongX) => ({
  north: alongX ? "false" : "true",
  south: alongX ? "false" : "true",
  east: alongX ? "true" : "false",
  west: alongX ? "true" : "false",
  waterlogged: "false",
});

const GLASS = "light_blue_stained_glass_pane";
const WALL = "white_terracotta";
const TRIM = "smooth_quartz";
const FASCIA = "red_concrete";
const ROOF = "light_gray_concrete";

// Entrance sits on the street (north, minimal z) facade, centred on the footprint
const entranceX = Math.floor(W / 2);

for (const [x, z, gr] of cells) {
  const b = Math.round(gr) - lowest; // this cell's ground level in building y

  const missX = !has(x - 1, z) || !has(x + 1, z);
  const missZ = !has(x, z - 1) || !has(x, z + 1);
  const edge = missX || missZ;
  const corner = missX && missZ;
  const street = !has(x, z - 1);          // north, street-facing edge
  const onZFace = missZ && !missX;        // wall runs along x
  const idx = onZFace ? x : z;            // bay index along the facade

  // Foundation under the cell
  for (let y = 0; y < b; y++) put(x, y, z, "stone_bricks");

  // Floor slab at ground level; base course on the perimeter
  put(x, b, z, edge ? "stone_bricks" : "smooth_stone");

  // Ground storey (rel 1..4)
  if (edge && !corner) {
    if (street && onZFace) {
      if (x === entranceX) {
        put(x, b + 1, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
        put(x, b + 2, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
        put(x, b + 3, z, TRIM);
      } else if (x % 5 === 0) {
        for (let r = 1; r <= 3; r++) put(x, b + r, z, "quartz_pillar", { axis: "y" });
      } else {
        put(x, b + 1, z, "smooth_stone");
        put(x, b + 2, z, GLASS, pane(true));
        put(x, b + 3, z, GLASS, pane(true));
      }
    } else {
      put(x, b + 1, z, WALL);
      const win = idx % 3 !== 0;
      put(x, b + 2, z, win ? GLASS : WALL, win ? pane(onZFace) : undefined);
      put(x, b + 3, z, win ? GLASS : WALL, win ? pane(onZFace) : undefined);
    }
    put(x, b + 4, z, FASCIA);
  } else if (corner) {
    for (let r = 1; r <= 4; r++) put(x, b + r, z, WALL);
    put(x, b + 4, z, FASCIA);
  }

  // Storey line between floors
  put(x, b + 5, z, edge ? TRIM : "smooth_stone");

  // Upper storey (rel 6..9)
  if (edge && !corner) {
    const win = idx % 3 !== 0;
    put(x, b + 6, z, win ? TRIM : WALL);
    put(x, b + 7, z, win ? GLASS : WALL, win ? pane(onZFace) : undefined);
    put(x, b + 8, z, win ? GLASS : WALL, win ? pane(onZFace) : undefined);
    put(x, b + 9, z, WALL);
  } else if (corner) {
    for (let r = 6; r <= 9; r++) put(x, b + r, z, WALL);
  }

  // Roof slab (rel 10) and parapet (rel 11)
  put(x, b + 10, z, edge ? TRIM : ROOF);
  if (edge) put(x, b + 11, z, TRIM);

  // Roof plant: small AC blocks on the roof deck
  if (!edge && x % 6 === 3 && z % 5 === 2) put(x, b + 11, z, "iron_block");

  // Warm lights: glowstone just inside some upper-floor windows
  if (edge && !corner && !(street && onZFace)) {
    const win = idx % 3 !== 0;
    if (win && (x * 3 + z) % 7 === 0) {
      const dx = onZFace ? 0 : (!has(x - 1, z) ? 1 : -1);
      const dz = onZFace ? (!has(x, z - 1) ? 1 : -1) : 0;
      if (has(x + dx, z + dz)) put(x + dx, b + 7, z + dz, "glowstone");
    }
  }

  // Arcade: hanging lanterns under the street-side slab, just inside the columns
  if (street && onZFace && x % 5 === 2 && has(x, z + 1)) {
    put(x, b + 4, z + 1, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
