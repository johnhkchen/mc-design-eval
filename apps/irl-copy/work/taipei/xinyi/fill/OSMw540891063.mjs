import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name, 16 x 13 footprint, roof ~11 blocks above lowest ground.
// Read as a two-storey, flat-roofed Xinyi-district commercial/civic block of the
// late 20th century: smooth cream cladding, stone base, tinted glazing with a
// shopfront at street level, a quartz parapet and a small roof penthouse.
// Storey lines are 5 blocks, so the roof lands at base + 11.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540891063";
const W = 16, H = 23, D = 13;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => ground.has(`${x},${z}`);
const B = Math.max(...cells.map((c) => Math.round(c[2])));

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Which sides of a footprint cell face outside the footprint.
const missing = (x, z) => {
  const m = [];
  if (!has(x, z + 1)) m.push("S");
  if (!has(x, z - 1)) m.push("N");
  if (!has(x + 1, z)) m.push("E");
  if (!has(x - 1, z)) m.push("W");
  return m;
};

const OUT = { S: [0, 1], N: [0, -1], E: [1, 0], W: [-1, 0] };
const IN = { S: [0, -1], N: [0, 1], E: [-1, 0], W: [1, 0] };

// Entrance: the street (south) face cell nearest the middle of the facade.
const southCells = cells
  .filter(([x, z]) => {
    const m = missing(x, z);
    return m.length === 1 && m[0] === "S";
  });
const meanX = southCells.reduce((s, c) => s + c[0], 0) / Math.max(1, southCells.length);
let entrance = null;
for (const [x, z] of southCells) {
  if (!entrance || Math.abs(x - meanX) < Math.abs(entrance[0] - meanX)) entrance = [x, z];
}
const [ex, ez] = entrance ?? [Math.floor(W / 2), D - 1];

const PANE_NS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const PANE_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const GLASS = "light_blue_stained_glass_pane";
const CLAD = "smooth_quartz";
const BASE = "polished_granite";
const KICK = "polished_andesite";
const ROOF = "light_gray_concrete";

// Pass 1: foundation, floor slabs and roof deck for every footprint cell.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < B; y++) put(x, y, z, y < gr ? "stone_bricks" : KICK);
}

const wallCells = [];
for (const [x, z] of cells) {
  const m = missing(x, z);
  if (m.length === 0) {
    // Interior: floor slabs at each storey line, roof deck on top.
    put(x, B, z, KICK);
    put(x, B + 5, z, KICK);
    put(x, B + 10, z, ROOF);
  } else {
    wallCells.push([x, z, m]);
  }
}

// Pass 2: facade on the footprint's edge cells.
for (const [x, z, m] of wallCells) {
  const corner = m.length >= 2;
  const face = m[0];
  const along = face === "S" || face === "N" ? x : z;
  const isEntrance = x === ex && z === ez && face === "S";
  const pier = !isEntrance && (corner || along % 3 === 0);
  const paneProps = face === "S" || face === "N" ? PANE_NS : PANE_EW;

  // Floors, storey lines, roof deck (solid across the wall too).
  put(x, B, z, BASE);          // base course
  put(x, B + 5, z, KICK);      // storey line
  put(x, B + 10, z, ROOF);     // roof deck
  put(x, B + 11, z, CLAD);     // parapet

  // Ground storey: kickplate, shopfront glazing, lintel band.
  if (isEntrance) {
    put(x, B + 1, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, B + 2, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, B + 3, z, GLASS, paneProps);
  } else {
    put(x, B + 1, z, pier ? CLAD : KICK);
    put(x, B + 2, z, pier ? CLAD : GLASS, pier ? undefined : paneProps);
    put(x, B + 3, z, pier ? CLAD : GLASS, pier ? undefined : paneProps);
  }
  put(x, B + 4, z, CLAD);      // lintel / fascia band

  // Upper storey: spandrels with a window band between.
  put(x, B + 6, z, CLAD);
  put(x, B + 9, z, CLAD);
  if (pier) {
    put(x, B + 7, z, CLAD);
    put(x, B + 8, z, CLAD);
  } else {
    put(x, B + 7, z, GLASS, paneProps);
    put(x, B + 8, z, GLASS, paneProps);
    // Warm light in the air gap behind some upper windows.
    if (along % 6 === 1) {
      const [dx, dz] = IN[face];
      const ix = x + dx, iz = z + dz;
      if (has(ix, iz) && missing(ix, iz).length === 0) {
        put(ix, B + 7, iz, "glowstone");
      }
    }
  }
}

// Lantern lighting the entrance hall behind the door.
{
  const [dx, dz] = IN.S;
  put(ex + dx, B + 1, ez + dz, "lantern", { hanging: "false" });
}

// Roof penthouse in the middle of the deck, clear of the parapet.
{
  let sx = 0, sz = 0, n = 0;
  for (const [x, z] of cells) { sx += x; sz += z; n++; }
  const cx = Math.round(sx / n), cz = Math.round(sz / n);
  for (const [x, z] of cells) {
    if (missing(x, z).length > 0) continue;
    if (Math.abs(x - cx) <= 2 && Math.abs(z - cz) <= 1) {
      put(x, B + 11, z, ROOF);
      put(x, B + 12, z, ROOF);
    }
  }
  put(cx, B + 13, cz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
