import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1341337628";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 7 x 19 x 11: one-storey 1960s-70s Taipei shophouse-style block, flat concrete
// with a tiled roof, shopfront on the south (street) side.
const W = 7, H = 19, D = 11;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const minG = Math.min(...cells.map((c) => c[2]));

const exposures = (x, z) => {
  const e = [];
  if (!has(x - 1, z)) e.push("W");
  if (!has(x + 1, z)) e.push("E");
  if (!has(x, z - 1)) e.push("N");
  if (!has(x, z + 1)) e.push("S");
  return e;
};
const isRing = (x, z) => exposures(x, z).length > 0;

// Pick the door on the south (street) face: middle cell of that face.
const southX = cells
  .filter(([x, z]) => exposures(x, z).includes("S"))
  .map(([x]) => x)
  .sort((a, b) => a - b);
const doorX = southX.length ? southX[Math.floor(southX.length / 2)] : -1;

const paneProps = (f) =>
  f === "W" || f === "E"
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

for (const [x, z, g0] of cells) {
  const gr = g0 - minG;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y <= gr; y++) g.set(x, y, z, "stone_bricks");

  const ex = exposures(x, z);

  // Interior cell: floor slab, air gap, ceiling slab, roof deck.
  if (ex.length === 0) {
    g.set(x, gr + 1, z, "smooth_stone");
    g.set(x, gr + 5, z, "smooth_quartz");
    g.set(x, gr + 6, z, "deepslate_tiles");
    g.set(x, gr + 7, z, "deepslate_tile_slab", { type: "bottom", waterlogged: "false" });
    continue;
  }

  // Ring (exterior) cell: base course.
  g.set(x, gr + 1, z, "stone_bricks");

  const corner = ex.length >= 2;
  const f = ex[0];
  const u = f === "W" || f === "E" ? z : x;

  let windowCell = false;

  if (corner) {
    for (let y = gr + 2; y <= gr + 4; y++) {
      g.set(x, y, z, "quartz_pillar", { axis: "y" });
    }
  } else if (f === "S") {
    // Shopfront on the street side.
    if (x === doorX) {
      g.set(x, gr + 2, z, "oak_door", {
        facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
      });
      g.set(x, gr + 3, z, "oak_door", {
        facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
      });
    } else {
      g.set(x, gr + 2, z, "glass");
      g.set(x, gr + 3, z, "glass");
    }
    g.set(x, gr + 4, z, "red_concrete");
  } else {
    // Window bays alternate along the face; piers in smooth quartz.
    windowCell = u % 2 === 1;
    for (let y = gr + 2; y <= gr + 4; y++) {
      if (windowCell) g.set(x, y, z, "glass_pane", paneProps(f));
      else g.set(x, y, z, "smooth_quartz");
    }
  }

  // Warm light in the air gap behind some windows.
  if (!corner && f !== "S" && windowCell && (u + gr) % 3 === 0) {
    const [ix, iz] =
      f === "W" ? [x + 1, z] : f === "E" ? [x - 1, z] : f === "N" ? [x, z + 1] : [x, z - 1];
    if (has(ix, iz) && !isRing(ix, iz)) {
      g.set(ix, gr + 3, iz, "shroomlight");
    }
  }

  // Cornice / parapet line.
  g.set(x, gr + 5, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });

  // Tiled eave: stairs with the low edge on the outside.
  g.set(x, gr + 6, z, "deepslate_tile_stairs", {
    facing: f === "W" ? "west" : f === "E" ? "east" : f === "N" ? "north" : "south",
    half: "bottom",
    shape: "straight",
    waterlogged: "false",
  });
}

g.save(`${DIR}/${ID}.nbt`);
