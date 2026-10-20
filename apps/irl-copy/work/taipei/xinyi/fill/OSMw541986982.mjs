import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw541986982";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

// 9 x 23 x 20: two tiled storeys (about 5 blocks each), parapet, roof plant
const W = 9, H = 23, D = 20;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const cellSet = new Set(cells.map(([x, z]) => key(x, z)));
const has = (x, z) => cellSet.has(key(x, z));

const put = (x, y, z, block, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

const faces = (x, z) => ({
  N: !has(x, z - 1), // street side, toward -z
  S: !has(x, z + 1),
  W: !has(x - 1, z),
  E: !has(x + 1, z),
});

const paneProps = (ns) =>
  ns
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Storey layout relative to each cell's ground gr:
//  o0 floor / base course, o1 bulkhead, o2-o3 glass, o4 spandrel,
//  o5 floor/string course, o6 spandrel, o7-o8 glass, o9 head,
//  o10 roof deck / string course, o11 parapet, o12 plant
const zs = cells.map(([, z]) => z);
const xs = cells.map(([x]) => x);
const zc = (Math.min(...zs) + Math.max(...zs)) / 2;
const xc = (Math.min(...xs) + Math.max(...xs)) / 2;

const lightCells = [];

for (const [x, z, gr] of cells) {
  // Foundation fill from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const f = faces(x, z);
  const nFaces = [f.N, f.S, f.W, f.E].filter(Boolean).length;
  const ex = nFaces > 0;
  const corner = nFaces >= 2;

  // Floor slabs at o0, o5, o10 on every footprint cell
  const slabId = (o) =>
    ex ? (o === 0 ? "polished_andesite" : "smooth_quartz") : "smooth_stone";
  for (const o of [0, 5, 10]) put(x, gr + o, z, slabId(o));

  if (!ex) continue;

  const nsFace = f.N || f.S;
  const u = nsFace ? x : z;
  const pier = corner || u % 2 === 0;
  const pane = (o) => put(x, gr + o, z, "light_blue_stained_glass_pane", paneProps(nsFace));

  // Ground storey body o1..o4
  for (let o = 1; o <= 4; o++) {
    if (pier) put(x, gr + o, z, "light_gray_concrete");
    else if (o === 1) put(x, gr + o, z, "polished_andesite");
    else if (o === 4) put(x, gr + o, z, "white_concrete");
    else pane(o);
  }

  // Upper storey body o6..o9
  for (let o = 6; o <= 9; o++) {
    if (pier) put(x, gr + o, z, "light_gray_concrete");
    else if (o === 6 || o === 9) put(x, gr + o, z, "white_concrete");
    else pane(o);
  }

  // Parapet ring
  put(x, gr + 11, z, "white_concrete");

  // Warm lights behind selected windows (inside air cell next to the glass)
  if (!corner && !pier) {
    let ix = x, iz = z;
    if (f.N) iz = z + 1;
    else if (f.S) iz = z - 1;
    else if (f.W) ix = x + 1;
    else if (f.E) ix = x - 1;
    const inwardExterior = faces(ix, iz);
    const inwardIsExt = inwardExterior.N || inwardExterior.S || inwardExterior.W || inwardExterior.E;
    if (has(ix, iz) && !inwardIsExt && u % 4 === 1) {
      lightCells.push([ix, gr + 2, iz, "glowstone"]);
      lightCells.push([ix, gr + 7, iz, "glowstone"]);
    }
  }
}

// Rooftop plant box on the interior of the roof deck
for (const [x, z, gr] of cells) {
  const f = faces(x, z);
  const ex = f.N || f.S || f.W || f.E;
  if (!ex && Math.abs(x - xc) <= 1 && Math.abs(z - zc) <= 2) {
    put(x, gr + 11, z, "light_gray_concrete");
    put(x, gr + 12, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Interior glow
for (const [x, y, z, block] of lightCells) put(x, y, z, block);

// Street entrance: the front-most cell nearest the middle of the street face
let door = null;
for (const [x, z, gr] of cells) {
  if (z !== Math.min(...zs)) continue;
  if (!door || Math.abs(x - xc) < Math.abs(door[0] - xc)) door = [x, z, gr];
}
if (door) {
  const [dx, dz, dg] = door;
  const doorProps = (half) => ({
    facing: "north",
    half,
    hinge: "left",
    open: "false",
    powered: "false",
  });
  put(dx, dg + 1, dz, "oak_door", doorProps("lower"));
  put(dx, dg + 2, dz, "oak_door", doorProps("upper"));
  put(dx, dg + 3, dz, "lantern", { hanging: "true", waterlogged: "false" });
}

g.save(`${dir}/${id}.nbt`);
