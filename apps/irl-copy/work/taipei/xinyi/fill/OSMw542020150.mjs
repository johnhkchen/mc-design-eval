import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Upper-floor mid-rise (no record): two-storey Taipei commercial block,
// quartz-tiled walls, light-blue glass, shopfront ground floor, parapet roof.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542020150";
const W = 15, H = 23, D = 10;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) ground.set(`${x},${z}`, gr);
}
const has = (x, z) => ground.has(`${x},${z}`);
const L = Math.min(...ground.values());
const F = L;                       // datum: lowest ground under the building
const SLABS = [F + 1, F + 6, F + 11]; // floor slabs; last one is the roof deck
const ROOF = F + 11;
const PARAPET = F + 12;

// Exterior faces of a footprint cell (neighbour missing)
function sidesOf(x, z) {
  const s = [];
  if (!has(x, z - 1)) s.push("N");
  if (!has(x, z + 1)) s.push("S");
  if (!has(x - 1, z)) s.push("W");
  if (!has(x + 1, z)) s.push("E");
  return s;
}

// Entrance: a single-face south-facing cell nearest the middle of the frontage
let doorKey = null;
{
  let best = Infinity;
  for (const k of ground.keys()) {
    const [x, z] = k.split(",").map(Number);
    const s = sidesOf(x, z);
    if (!s.includes("S")) continue;
    const score = (s.length > 1 ? 100 : 0) + Math.abs(x - 7);
    if (score < best) { best = score; doorKey = k; }
  }
}

const paneProps = (face) => {
  const alongX = face === "N" || face === "S";
  return {
    north: alongX ? "false" : "true",
    south: alongX ? "false" : "true",
    east: alongX ? "true" : "false",
    west: alongX ? "true" : "false",
    waterlogged: "false",
  };
};

for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);

  // Foundation: solid from y 0 up to the cell's ground
  for (let y = 0; y <= gr; y++) g.set(x, y, z, "stone_bricks");

  const sides = sidesOf(x, z);
  const perim = sides.length > 0;
  const corner = sides.length > 1;
  const face = sides[0] ?? null;
  const idx = (face === "N" || face === "S") ? x : z;
  const isDoor = perim && key === doorKey;

  const slabs = SLABS.filter(s => s > gr);
  const firstSlab = slabs[0];

  for (let y = gr + 1; y <= PARAPET; y++) {
    // Infill between ground and the first storey slab (sloped/downhill cells)
    if (y < firstSlab) {
      g.set(x, y, z, "stone_bricks");
      continue;
    }

    if (slabs.includes(y)) {
      if (y === ROOF) g.set(x, y, z, "light_gray_concrete");
      else g.set(x, y, z, perim ? "light_gray_concrete" : "smooth_stone");
      continue;
    }

    if (y === PARAPET) {
      if (perim) {
        g.set(x, y, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
      } else if (x % 4 === 1 && z % 3 === 1) {
        g.set(x, y, z, "iron_block"); // rooftop AC unit
      }
      continue;
    }

    // Storey rows
    const s = [...SLABS].filter(v => v < y).pop();
    const rel = y - s;

    if (!perim) {
      // Interior: air gap, with warm shroomlights behind some windows
      if (rel === 2 && (x * 5 + z * 3 + s) % 6 === 0) g.set(x, y, z, "shroomlight");
      continue;
    }

    if (s === F + 1) {
      // Ground floor: shopfront
      const pier = corner || idx % 3 === 0;
      if (rel === 4) { g.set(x, y, z, "smooth_quartz"); continue; }
      if (isDoor && rel <= 2) {
        g.set(x, y, z, "dark_oak_door", {
          facing: "south",
          half: rel === 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }
      if (pier) g.set(x, y, z, "quartz_bricks");
      else g.set(x, y, z, "light_blue_stained_glass");
      continue;
    }

    // Upper storeys
    const pier = corner || idx % 2 === 0;
    if (rel === 1) { g.set(x, y, z, "light_gray_concrete"); continue; } // sill band
    if (rel === 4) { g.set(x, y, z, "smooth_quartz"); continue; }       // lintel / storey line
    if (pier) g.set(x, y, z, "quartz_bricks");
    else if (face) g.set(x, y, z, "light_blue_stained_glass_pane", paneProps(face));
    else g.set(x, y, z, "light_blue_stained_glass_pane", paneProps("N"));
  }
}

g.save(`${DIR}/${ID}.nbt`);
