import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw258614055";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 揚昇忠孝大樓: 1980s three-storey Zhongxiao commercial block.
// White tiled-concrete walls with light-grey concrete ribs, a stone base,
// tinted glass in light-grey frames, a shopfront on the ground floor,
// a recessed entrance with stone piers and lanterns, and a flat roof
// with plant boxes and a stair housing.
const W = 55, H = 24, D = 60;
const ROOF = 11;       // top solid block of the storeys; interior roof slab here
const PARAPET = 12;    // parapet course on perimeter cells
const SLABS = [4, 8, 11];

const g = new Voxels([W, H, D]);
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);

const WALL = "white_concrete";
const RIB = "light_gray_concrete";
const CORNICE = "smooth_stone";
const FOUND = "stone_bricks";
const PANE_Z = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const PANE_X = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

const expo = (x, z) => ({
  W: !has(x - 1, z),
  E: !has(x + 1, z),
  N: !has(x, z - 1),
  S: !has(x, z + 1),
});
const isInterior = (x, z) => {
  if (!has(x, z)) return false;
  const e = expo(x, z);
  return !(e.W || e.E || e.N || e.S);
};

// Entrance: exposed north face, low ground, nearest the frontage middle
let doorKey = null, bestD = Infinity;
for (const [x, z, gr] of cells) {
  const e = expo(x, z);
  if (!e.N || gr > 1) continue;
  const d = Math.abs(x - 27);
  if (d < bestD) { bestD = d; doorKey = `${x},${z}`; }
}
const [dx, dz] = doorKey ? doorKey.split(",").map(Number) : [-1, -1];
const doorGr = doorKey ? Math.max(0, Math.min(Math.round(gnd(dx, dz)), ROOF)) : 0;
const doorOk = doorKey && doorGr + 2 <= 3;

for (const [x, z, gr0] of cells) {
  const gr = Math.max(0, Math.min(Math.round(gr0), ROOF));
  const e = expo(x, z);
  const we = e.W || e.E;
  const ns = e.N || e.S;
  const perim = we || ns;

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);

  if (!perim) {
    // Interior: air behind the glass, floor slabs at storey lines
    for (const y of SLABS) if (y >= gr && y <= ROOF) g.set(x, y, z, RIB);

    // Roof plant boxes on a grid, standing on the roof slab
    if (x % 7 === 3 && z % 9 === 4) {
      for (const y of [PARAPET, PARAPET + 1]) g.set(x, y, z, "stone");
    }
    // Stair and lift housing, solid box with a cap
    if (x >= 22 && x <= 30 && z >= 23 && z <= 29) {
      for (const y of [PARAPET, PARAPET + 1]) g.set(x, y, z, WALL);
      g.set(x, PARAPET + 2, z, RIB);
    }
    continue;
  }

  // Perimeter wall, ground to cornice
  for (let y = gr; y <= ROOF; y++) g.set(x, y, z, WALL);

  // Stone base course
  if (gr <= 3) g.set(x, gr, z, FOUND);

  // Cornice and parapet
  g.set(x, ROOF, z, CORNICE);
  g.set(x, PARAPET, z, WALL);

  // Pier index along this face: ribs every third cell
  const along = we ? z : x;
  const isPier = along % 3 === 0;

  // Ground storey: shopfront bays between stone-base piers, transom band above
  for (let y = gr + 1; y <= 2; y++) {
    if (isPier) g.set(x, y, z, FOUND);
    else g.set(x, y, z, "light_blue_stained_glass");
  }
  if (3 >= gr) g.set(x, 3, z, RIB);

  // Upper storeys: window grid in light-grey frames, ribs as piers
  const winCond = !isPier && along % 3 === 1;
  const paneProps = we ? PANE_Z : PANE_X;
  for (const [y0, y1] of [[6, 7], [9, 10]]) {
    if (y1 < gr) continue;
    if (winCond) {
      g.set(x, y0 - 1, z, RIB); // lintel
      for (let y = Math.max(y0, gr); y <= y1; y++) {
        g.set(x, y, z, "light_blue_stained_glass_pane", paneProps);
      }
      // Warm light inside, behind some windows
      if ((x * 7 + z * 13 + y0) % 5 === 0) {
        let nx = x, nz = z;
        if (e.W) nx = x + 1; else if (e.E) nx = x - 1;
        else if (e.N) nz = z + 1; else if (e.S) nz = z - 1;
        if (isInterior(nx, nz)) {
          const lamp = (x + z) % 3 === 0 ? "shroomlight" : "glowstone";
          g.set(nx, y0, nz, lamp);
        }
      }
    } else {
      for (let y = Math.max(y0, gr); y <= y1; y++) {
        g.set(x, y, z, isPier ? RIB : WALL);
      }
    }
  }
}

// Entrance: stone piers flank the door, lanterns beside it, door in the frontage
if (doorOk) {
  // Flanking piers on the frontage, ground storey
  for (const ox of [-1, 1]) {
    const px = dx + ox;
    if (!has(px, dz)) continue;
    for (let y = doorGr; y <= 3; y++) g.set(px, y, dz, FOUND);
    g.set(px, doorGr + 2, dz, "lantern", { hanging: "false", waterlogged: "false" });
  }
  // Door
  g.set(dx, doorGr + 1, dz, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(dx, doorGr + 2, dz, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  // Lintel course above the door in the transom band
  g.set(dx, 3, dz, FOUND);
}

g.save(`${DIR}/${ID}.nbt`);
