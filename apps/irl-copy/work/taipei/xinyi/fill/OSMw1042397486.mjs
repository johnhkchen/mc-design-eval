import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1042397486";
const W = 20, H = 23, D = 18;

// Record: roof ~11 blocks above lowest ground (~8 m). Read as a two-storey
// 1980s-90s Taiwanese commercial block: pale tiled/concrete facade, storey
// lines, shopfront-style ground floor with a dark-framed entrance, flat roof
// with parapet and a small rooftop plant box.
const ROOF = 11;   // roof deck layer
const FL = 5;      // first floor line (storey 1 = rows 0..4)
const TOP = 10;    // cornice / second floor slab

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const minG = Math.min(...raw.map((c) => c[2]));
const gr = new Map();
for (const [x, z, gg] of raw) gr.set(`${x},${z}`, gg - minG);

const has = (x, z) => gr.has(`${x},${z}`);
const gof = (x, z) => gr.get(`${x},${z}`);
const cellsXY = raw.map(([x, z]) => [x, z]);

const vox = new Voxels([W, H, D]);

function place(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) vox.set(x, y, z, id, props);
  else vox.set(x, y, z, id);
}

function facesOf(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push("north");
  if (!has(x, z + 1)) f.push("south");
  if (!has(x - 1, z)) f.push("west");
  if (!has(x + 1, z)) f.push("east");
  return f;
}

// Entrance: the south-facing edge cell nearest x = 9.
const southEdge = cellsXY.filter(([x, z]) => !has(x, z + 1));
let door = null;
for (const [x, z] of southEdge) {
  if (!door || Math.abs(x - 9) < Math.abs(door[0] - 9)) door = [x, z];
}

function wall(x, z, dir, gc) {
  const ns = dir === "north" || dir === "south";
  const u = ns ? x : z;
  const isDoor = dir === "south" && door && x === door[0] && z === door[1];
  const glassProps = ns
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };

  for (let y = gc + 1; y <= TOP - 1; y++) {
    if (y === FL) continue; // floor slab already placed

    if (y < FL - 1) {
      // ground floor shopfront band
      if (isDoor) {
        if (y === gc + 1) {
          place(x, y, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
        } else if (y === gc + 2) {
          place(x, y, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
        } else {
          place(x, y, z, "stone_bricks");
        }
      } else if (u % 3 === 0) {
        place(x, y, z, "stone_bricks");
      } else {
        place(x, y, z, "glass_pane", glassProps);
      }
      continue;
    }

    if (y === FL - 1) {
      // lintel over the shopfronts
      place(x, y, z, "stone_bricks");
      continue;
    }

    // upper storey, rows FL+1 .. TOP-1
    if (y === FL + 1 || y === TOP - 1) {
      place(x, y, z, "light_gray_concrete"); // spandrels / sill-head bands
    } else if (u % 3 === 0) {
      place(x, y, z, "white_concrete");      // mullion piers
    } else {
      place(x, y, z, "glass_pane", glassProps);
    }
  }

  // warm light behind some windows (single interior block, air around it)
  if (!isDoor && u % 6 === 1) {
    const inward = dir === "north" ? [x, z + 1] : dir === "south" ? [x, z - 1]
      : dir === "west" ? [x + 1, z] : [x - 1, z];
    const [ix, iz] = inward;
    if (has(ix, iz)) {
      const ig = gof(ix, iz);
      const groundRow = gc + 2;
      if (groundRow <= FL - 2 && groundRow > ig) place(ix, groundRow, iz, "glowstone");
      if (7 > ig) place(ix, 7, iz, "glowstone");
    }
  }
}

for (const [x, z] of cellsXY) {
  const gc = gof(x, z);
  const faces = facesOf(x, z);
  const edge = faces.length > 0;

  // foundation fill from y 0 up to this cell's ground
  for (let y = 0; y < gc; y++) place(x, y, z, "stone_bricks");
  // plinth / floor at ground level
  place(x, gc, z, edge ? "polished_andesite" : "smooth_stone");
  // storey floor slab and cornice level
  if (gc < FL) place(x, FL, z, "smooth_stone");
  if (gc < TOP) place(x, TOP, z, "smooth_stone");
  // roof deck
  place(x, ROOF, z, "gray_concrete");
  // parapet
  if (edge) place(x, ROOF + 1, z, "stone_bricks");

  if (faces.length > 1) {
    // corner: solid pier through the storeys
    for (let y = gc + 1; y <= TOP - 1; y++) place(x, y, z, "white_concrete");
  } else if (faces.length === 1) {
    wall(x, z, faces[0], gc);
  }
}

// rooftop plant box on the deck, set well inside the footprint
for (const [x, z] of cellsXY) {
  if (x >= 7 && x <= 12 && z >= 6 && z <= 11 && facesOf(x, z).length === 0) {
    place(x, ROOF + 1, z, "light_gray_concrete");
    place(x, ROOF + 2, z, "light_gray_concrete");
  }
}

vox.save(`${DIR}/${ID}.nbt`);
