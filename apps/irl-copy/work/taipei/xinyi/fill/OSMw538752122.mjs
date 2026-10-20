import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise two-storey Xinyi commercial block: white-tiled concrete walls, stone base,
// shopfront ground floor with a dark-oak entrance, glazed upper storey, cornice parapet,
// flat roof with a small plant penthouse. Roof top sits near y 11 above the lowest ground.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538752122";
const W = 27, H = 23, D = 19;
const ROOF = 10;      // top body layer; cornice sits here, roof surface ~y 11
const FLOOR2 = 5;     // storey line between the two floors

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, Math.max(0, Math.round(gr)));

const g = new Voxels([W, H, D]);
const inFp = (x, z) => G.has(`${x},${z}`);
const gr = (x, z) => G.get(`${x},${z}`);
const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const NB = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];
const outs = (x, z) => NB.filter(([dx, dz]) => !inFp(x + dx, z + dz));

const panePropsFor = (face) =>
  face === "north" || face === "south"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const cellsList = [...G.keys()].map((k) => k.split(",").map(Number));

for (const [x, z] of cellsList) {
  const gnd = gr(x, z);
  const o = outs(x, z);
  const edge = o.length > 0;
  const corner = o.length >= 2;
  const face = edge ? o[0][2] : null;
  const u = face === "east" || face === "west" ? z : x; // coordinate running along the facade
  const doorCell = edge && !corner && u % 9 === 4 && gnd + 2 <= 4;

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gnd; y++) put(x, y, z, "stone_bricks");

  for (let y = gnd; y <= ROOF; y++) {
    // Interior (no facade): only floor slabs and roof deck, air otherwise
    if (!edge) {
      if (y === FLOOR2) put(x, y, z, "smooth_stone");
      else if (y === ROOF) put(x, y, z, "light_gray_concrete");
      continue;
    }

    // Corner columns run full height
    if (corner) {
      put(x, y, z, "polished_andesite");
      continue;
    }

    // Cornice / parapet cap
    if (y === ROOF) {
      put(x, y, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
      continue;
    }

    // Base course
    if (y === gnd) {
      put(x, y, z, "stone_bricks");
      continue;
    }

    // Storey line
    if (y === FLOOR2) {
      put(x, y, z, "polished_andesite");
      continue;
    }

    const inGround = y < FLOOR2;

    // Entrance with dark oak door and canopy
    if (inGround && doorCell) {
      if (y === gnd + 1) {
        put(x, y, z, "dark_oak_door", {
          facing: face, half: "lower", hinge: "left", open: "false", powered: "false",
        });
        continue;
      }
      if (y === gnd + 2) {
        put(x, y, z, "dark_oak_door", {
          facing: face, half: "upper", hinge: "left", open: "false", powered: "false",
        });
        continue;
      }
      if (y === gnd + 3) {
        put(x, y, z, "smooth_stone_slab", { type: "top", waterlogged: "false" });
        continue;
      }
    }

    // Shopfront / upper window band
    const winBand = inGround ? y >= gnd + 1 && y <= gnd + 2 : y >= 6 && y <= 8;
    if (winBand) {
      if (u % 3 === 0) {
        put(x, y, z, "polished_andesite");
      } else if (inGround && y === gnd + 1 && u % 3 === 2 && (u * 3 + x) % 7 === 0) {
        put(x, y, z, "glowstone");           // warm light behind shopfront glass
      } else if (!inGround && y === 7 && u % 3 === 1 && (u + z + x) % 5 === 0) {
        put(x, y, z, "glowstone");           // warm light in upper storey
      } else {
        put(x, y, z, "glass_pane", panePropsFor(face));
      }
      continue;
    }

    // Shopfront lintel
    if (inGround && y === gnd + 3) {
      put(x, y, z, "smooth_stone");
      continue;
    }

    // Plain tiled wall
    put(x, y, z, "white_concrete");
  }
}

// Roof plant: a small penthouse block and a few condenser units on interior roof cells
for (let x = 8; x <= 12; x++) {
  for (let z = 6; z <= 9; z++) {
    if (!inFp(x, z) || outs(x, z).length) continue;
    put(x, 11, z, "light_gray_concrete");
    if (x >= 9 && x <= 11 && z >= 7 && z <= 8) put(x, 12, z, "light_gray_concrete");
  }
}
for (const [x, z] of [[3, 3], [4, 3], [3, 4]]) {
  if (inFp(x, z) && !outs(x, z).length) put(x, 11, z, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);
