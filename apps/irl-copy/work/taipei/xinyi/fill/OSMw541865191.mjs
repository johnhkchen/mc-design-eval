import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Xinyi-district 1980s-style low commercial block: white-tiled concrete frame,
// light-grey storey bands, aluminium-framed glass grid, shopfront with dark-oak
// entrance on the street (south) face, flat roof with parapet and rooftop tank.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541865191";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 11, H = 23, D = 17;
const g = new Voxels([W, H, D]);

// Footprint lookup: key "x,z" -> ground value (clamped so storeys keep their frame)
const G = new Map();
for (const [x, z, gr] of cells) {
  const v = Math.min(4, Math.max(0, Math.round(gr)));
  G.set(`${x},${z}`, v);
}
const has = (x, z) => G.has(`${x},${z}`);

const isPerim = (x, z) =>
  !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);

const nearPerim = (x, z) =>
  isPerim(x + 1, z) && has(x + 1, z) ||
  isPerim(x - 1, z) && has(x - 1, z) ||
  isPerim(x, z + 1) && has(x, z + 1) ||
  isPerim(x, z - 1) && has(x, z - 1);

// Facing of an exterior wall cell: street (south, +z) takes priority.
const faceOf = (x, z) => {
  if (!has(x, z + 1)) return "south";
  if (!has(x, z - 1)) return "north";
  if (!has(x + 1, z)) return "east";
  return "west";
};

// Glass pane connection states aligned with the wall run.
const paneProps = (face) =>
  face === "south" || face === "north"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Upper / ordinary window bay: glass panes with grey concrete mullions every third block.
const windowBlock = (t, face) => {
  if (t % 3 === 0) return { id: "gray_concrete" };
  return { id: "glass_pane", props: paneProps(face) };
};

// Storey heights (absolute): base course at ground, shopfront to 3, band at 4,
// floor slab 5, upper windows 6..8, lintel 9, roof deck 10, parapet 11.
const SLAB_LOW = 5, DECK = 10, PARAPET = 11;

for (const [x, z, gr0] of cells) {
  const gr = Math.min(4, Math.max(0, Math.round(gr0)));

  // Foundation under every footprint cell
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Floor slabs for every storey and the roof deck, full footprint
  g.set(x, SLAB_LOW, z, "smooth_stone");
  g.set(x, DECK, z, "smooth_stone");

  if (!isPerim(x, z)) {
    // Warm light behind some interior-ring windows (upper storey)
    if (nearPerim(x, z) && (x + z) % 3 === 0) g.set(x, 7, z, "shroomlight");
    continue;
  }

  const face = faceOf(x, z);
  const t = face === "south" || face === "north" ? x : z;
  const pp = paneProps(face);

  for (let y = gr; y <= PARAPET; y++) {
    // Parapet
    if (y === PARAPET) { g.set(x, y, z, "white_concrete"); continue; }
    // Roof deck band and lintel above upper windows
    if (y === DECK || y === 9) { g.set(x, y, z, "light_gray_concrete"); continue; }
    // Upper-storey windows
    if (y >= 6 && y <= 8) {
      const w = windowBlock(t, face);
      g.set(x, y, z, w.id, w.props);
      continue;
    }
    // Storey band at 5 and at 4 (top of ground floor)
    if (y === SLAB_LOW || y === 4) { g.set(x, y, z, "light_gray_concrete"); continue; }

    // Ground floor, y from gr to 3
    if (face === "south" && t === 5 && gr <= 2 && (y === gr || y === gr + 1)) {
      // Entrance door, lower and upper halves
      g.set(x, y, z, "dark_oak_door", {
        facing: "north",
        half: y === gr ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }
    if (face === "south" && y === gr + 2 && t >= 3 && t <= 7) {
      // Canopy band over the entrance
      g.set(x, y, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
      continue;
    }
    if (y === gr) { g.set(x, y, z, "polished_andesite"); continue; }

    if (face === "south") {
      // Shopfront: glass with grey concrete pillars
      if (t % 4 === 0) g.set(x, y, z, "gray_concrete");
      else g.set(x, y, z, "glass_pane", pp);
    } else {
      const w = windowBlock(t, face);
      g.set(x, y, z, w.id, w.props);
    }
  }
}

// Rooftop water tank on a concrete pedestal, and a lightning rod (only on footprint cells)
const tankCells = [[3, 6], [4, 6], [3, 7], [4, 7]];
for (const [x, z] of tankCells) {
  if (!has(x, z)) continue;
  g.set(x, PARAPET, z, "stone_bricks");
  g.set(x, PARAPET + 1, z, "iron_block");
  g.set(x, PARAPET + 2, z, "iron_block");
}

const rodCell = [8, 4];
if (has(rodCell[0], rodCell[1])) {
  for (let y = PARAPET; y <= PARAPET + 2; y++) {
    if (y === PARAPET) g.set(rodCell[0], y, rodCell[1], "stone_bricks");
    else g.set(rodCell[0], y, rodCell[1], "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
  g.set(rodCell[0], PARAPET + 2, rodCell[1], "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
