// Record: no OSM tags. Lidar roof ~11 blocks above lowest ground. Read as a
// two-storey, flat-roofed Xinyi-era commercial block (1980s-90s): stone-brick
// plinth, pale tiled-concrete frame, tinted glazing in between, a shopfront
// on the ground floor, a storey band at the midline, and a parapet with
// rooftop plant. Two storeys of about 5 blocks each, roof deck at base+10,
// parapet at base+11.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540888799";
const W = 15, H = 23, D = 14;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);
const gnd = (x, z) => G.get(`${x},${z}`);
const base0 = Math.min(...G.values());
const ROOF = base0 + 10;            // roof deck level for the typical cell

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p); else g.set(x, y, z, id);
};

// Outward faces of a footprint cell (cells outside the footprint are open air).
function faces(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push("north");
  if (!has(x, z + 1)) f.push("south");
  if (!has(x - 1, z)) f.push("west");
  if (!has(x + 1, z)) f.push("east");
  return f;
}

const paneProps = (face) => {
  const ew = face === "north" || face === "south";
  return {
    north: ew ? "false" : "true",
    south: ew ? "false" : "true",
    east: ew ? "true" : "false",
    west: ew ? "true" : "false",
    waterlogged: "false",
  };
};

const inward = { north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] };

// Pass 1: foundations, floors, roof deck, parapet and walls.
for (const [x, z, gr] of cells) {
  const fs = faces(x, z);
  const ext = fs.length > 0;
  const rT = Math.min(Math.max(ROOF, gr + 6), H - 4);

  // Foundation from y0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Ground floor slab / plinth course.
  put(x, gr, z, ext ? "polished_granite" : "smooth_stone");

  // Storey line and upper floor slab.
  if (gr + 5 < rT) put(x, gr + 5, z, ext ? "quartz_block" : "smooth_stone");

  // Roof deck on every cell.
  put(x, rT, z, "light_gray_concrete");

  if (!ext) continue;

  // Parapet course on perimeter.
  put(x, rT + 1, z, "white_concrete");

  const face = fs[0];
  const L = (face === "north" || face === "south") ? W : D;
  const t = (face === "north" || face === "south") ? x : z;
  const isEnd = t === 0 || t === L - 1;
  const southEntrance = face === "south" && x === 7 && z === D - 1;

  // Storey 1: shopfront, entrance door, lintel, piers.
  for (let y = gr + 1; y <= gr + 4 && y < rT; y++) {
    if (southEntrance && y <= gr + 2) {
      continue; // door placed below
    }
    if (face === "south" && x >= 6 && x <= 8 && y === gr + 3) {
      put(x, y, z, "white_concrete");   // lintel over entrance
      continue;
    }
    if (isEnd || t % 4 === 0) {
      put(x, y, z, "quartz_block");
    } else {
      put(x, y, z, "light_blue_stained_glass_pane", paneProps(face));
    }
  }

  // Storey 2: window grid with piers every third bay.
  for (let y = gr + 6; y <= rT - 1; y++) {
    if (isEnd || t % 3 === 0) {
      put(x, y, z, "white_concrete");
    } else {
      put(x, y, z, "light_blue_stained_glass_pane", paneProps(face));
    }
  }
}

// Pass 2: entrance door (two-high), placed after walls so it wins.
if (has(7, D - 1)) {
  const gr = gnd(7, D - 1);
  const dp = { facing: "south", hinge: "left", open: "false", powered: "false" };
  put(7, gr + 1, D - 1, "dark_oak_door", { ...dp, half: "lower" });
  put(7, gr + 2, D - 1, "dark_oak_door", { ...dp, half: "upper" });
}

// Pass 3: warm lights in the air gap behind selected windows.
for (const [x, z, gr] of cells) {
  const fs = faces(x, z);
  if (fs.length === 0) continue;
  const face = fs[0];
  const L = (face === "north" || face === "south") ? W : D;
  const t = (face === "north" || face === "south") ? x : z;
  if (t === 0 || t === L - 1) continue;
  const [dx, dz] = inward[face];
  const ix = x + dx, iz = z + dz;
  if (!has(ix, iz)) continue;
  const ig = gnd(ix, iz);
  const rT = Math.min(Math.max(ROOF, ig + 6), H - 4);
  // Upper storey lamps behind some windows.
  if (t % 6 === 1 && ig + 6 < rT) {
    put(ix, ig + 6, iz, "lantern", { hanging: "false", waterlogged: "false" });
  }
  // Ground floor lamps behind some shopfront glass.
  if (t % 5 === 2 && ig + 1 < ig + 5) {
    put(ix, ig + 1, iz, "glowstone");
  }
}

// Pass 4: rooftop plant box and a smaller housing on top.
const rooftopRoof = Math.min(Math.max(ROOF, base0 + 6), H - 4);
for (let x = 5; x <= 9; x++) {
  for (let z = 4; z <= 8; z++) {
    if (!has(x, z)) continue;
    const gr = gnd(x, z);
    const rT = Math.min(Math.max(ROOF, gr + 6), H - 4);
    put(x, rT + 1, z, "light_gray_concrete");
    if (x >= 6 && x <= 8 && z >= 5 && z <= 7) {
      put(x, rT + 2, z, "light_gray_concrete");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
