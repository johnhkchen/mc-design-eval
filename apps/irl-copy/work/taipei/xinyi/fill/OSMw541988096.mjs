import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw541988096";
const cells = JSON.parse(readFileSync(`${SRC}.cells.json`, "utf8"));

// Footprint 13 x 16, roof about 11 blocks above lowest ground: two storeys of
// about 5 blocks each, with a parapet course. Mid-century Taipei commercial/office
// block: white concrete frame, smooth stone base, glazed ribbon bands, flat roof.
const W = 13, H = 23, D = 16;
const TOP = 11;          // roof top sits 11 blocks above datum (y 0)
const PARAPET_Y = TOP - 1; // y = 10
const STOREY_LINE = 5;

const G = new Map();
for (const [x, z, gr] of cells) {
  G.set(`${x},${z}`, Math.max(0, Math.min(gr, TOP - 3)));
}
const has = (x, z) => G.has(`${x},${z}`);
const gnd = (x, z) => G.get(`${x},${z}`);

const exposed = (x, z) => ({
  n: !has(x, z - 1),
  s: !has(x, z + 1),
  w: !has(x - 1, z),
  e: !has(x + 1, z),
});

const g = new Voxels([W, H, D]);

for (const [key, gy] of G) {
  const [x, z] = key.split(",").map(Number);
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gy; y++) g.set(x, y, z, "stone_bricks");

  const f = exposed(x, z);
  const count = (f.n ? 1 : 0) + (f.s ? 1 : 0) + (f.w ? 1 : 0) + (f.e ? 1 : 0);
  const perim = count > 0;
  const corner = count >= 2;

  if (!perim) {
    // Interior: floor slabs at ground floor and upper floor, roof deck, air between
    g.set(x, gy, z, "smooth_stone");
    if (gy < STOREY_LINE) g.set(x, STOREY_LINE, z, "smooth_stone");
    g.set(x, PARAPET_Y, z, "gray_concrete");
    // Warm lights set back behind the glazing on some interior cells
    if ((x * 3 + z * 5) % 7 === 0) {
      if (2 > gy) g.set(x, 2, z, "shroomlight");
      if (7 > gy) g.set(x, 7, z, "shroomlight");
    }
    continue;
  }

  // Perimeter facade, from this cell's ground up to the parapet
  for (let y = gy; y <= PARAPET_Y; y++) {
    if (y === gy) {
      g.set(x, y, z, "smooth_stone");                 // base course
    } else if (y === 4 || y === 9) {
      g.set(x, y, z, "white_concrete");               // lintel courses
    } else if (y === STOREY_LINE) {
      g.set(x, y, z, "smooth_stone");                 // storey line
    } else if (y === PARAPET_Y) {
      g.set(x, y, z, "white_concrete");               // parapet
    } else {
      // Window bands: rows 1-3 and 6-8
      const pier = corner || (x + z) % 3 === 0;
      if (pier) {
        g.set(x, y, z, "white_concrete");
      } else if (f.n || f.s) {
        g.set(x, y, z, "glass_pane", {
          north: "false", south: "false", east: "true", west: "true", waterlogged: "false",
        });
      } else {
        g.set(x, y, z, "glass_pane", {
          north: "true", south: "true", east: "false", west: "false", waterlogged: "false",
        });
      }
    }
  }

  // Air gap behind the glass: interior cell stays empty between slabs, with
  // a warm light behind some panes on the perimeter's inner side
  if (perim && (x + z) % 4 === 1) {
    const ix = f.w ? x + 1 : f.e ? x - 1 : x;
    const iz = f.n ? z + 1 : f.s ? z - 1 : z;
    if (has(ix, iz) && !exposed(ix, iz).n && ix !== x || iz !== z) {
      const ly = 7;
      if (ly > gnd(ix, iz) && has(ix, iz)) g.set(ix, ly, iz, "shroomlight");
    }
  }
}

// Roof deck on interior cells is set above; perimeter parapet is set in the facade loop.

// Entrance: south-facing perimeter cell nearest the centre line, double iron door
let door = null;
for (const [key, gy] of G) {
  const [x, z] = key.split(",").map(Number);
  if (!exposed(x, z).s) continue;
  const score = Math.abs(x - 6);
  if (!door || score < door.score) door = { x, z, gy, score };
}
if (door) {
  const { x, z, gy } = door;
  g.set(x, gy, z, "iron_door", {
    facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  g.set(x, gy + 1, z, "iron_door", {
    facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
  });
  g.set(x, gy + 2, z, "white_concrete"); // door head lintel
}

g.save(`${SRC}.nbt`);
