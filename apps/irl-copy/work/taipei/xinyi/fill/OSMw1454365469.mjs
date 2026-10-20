import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1454365469";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 9, H = 23, D = 8;
const g = new Voxels([W, H, D]);

// Low-rise 1980s-style commercial block: stone plinth, two storeys of
// cream tile and tinted glazing, storefront ground floor, quartz cornice,
// parapet and a small rooftop plant box. Y 0 = lowest ground.
const key = (x, z) => `${x},${z}`;
const occ = new Map(cells.map(([x, z, gr]) => [key(x, z), gr]));
const minG = Math.min(...cells.map((c) => c[2]));

const FACES = [
  ["north", 0, -1],
  ["south", 0, 1],
  ["west", -1, 0],
  ["east", 1, 0],
];

const exteriorFaces = (x, z) =>
  FACES.filter(([, dx, dz]) => !occ.has(key(x + dx, z + dz)));

const paneProps = (face) =>
  face === "north" || face === "south"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Pick the street-facing side (south) as the primary facade where present.
const doorCandidates = [];

for (const [x, z, gr] of cells) {
  const gc = gr - minG;
  const ext = exteriorFaces(x, z);
  const perim = ext.length > 0;
  const corner = ext.length >= 2;
  const primary = ext.find((f) => f[0] === "south") ?? ext[0];
  const face = primary ? primary[0] : null;
  const u = face === "north" || face === "south" ? x : z;
  const mullion = corner || u % 2 === 0;

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gc; y++) g.set(x, y, z, "stone_bricks");

  // Ground level floor / plinth
  g.set(x, gc, z, perim ? "polished_andesite" : "smooth_stone");

  if (perim) {
    // Storefront: glass between quartz piers, quartz lintel at y 4
    for (let y = gc + 1; y <= 3; y++) {
      if (mullion) g.set(x, y, z, "smooth_quartz");
      else g.set(x, y, z, "cyan_stained_glass_pane", paneProps(face));
    }
    g.set(x, 4, z, "smooth_quartz");
  }

  // Storey line at y 5
  g.set(x, 5, z, perim ? "smooth_quartz" : "smooth_stone");

  if (perim) {
    // Upper storey: tinted glazing with quartz piers
    for (let y = 6; y <= 9; y++) {
      if (mullion) g.set(x, y, z, "smooth_quartz");
      else g.set(x, y, z, "cyan_stained_glass_pane", paneProps(face));
    }
  }

  // Roof slab / cornice at y 10 (solid across the whole footprint)
  g.set(x, 10, z, perim ? "smooth_quartz" : "gray_concrete");

  // Parapet at y 11 on the perimeter only
  if (perim) g.set(x, 11, z, "smooth_quartz");

  // Warm lights: glowstone just inside upper windows, shroomlight in shopfront
  if (perim && face && !mullion) {
    const [, dx, dz] = primary;
    const ix = x - dx, iz = z - dz;
    if (occ.has(key(ix, iz))) {
      if (u % 3 === 1) g.set(ix, 7, iz, "glowstone");
      if (u % 3 === 2) g.set(ix, gc + 2, iz, "shroomlight");
    }
  }

  if (perim && face === "south") doorCandidates.push([x, z, gc]);
}

// Entrance: a dark oak door in the middle of the south storefront
if (doorCandidates.length) {
  doorCandidates.sort((a, b) => a[0] - b[0]);
  const [dx, dz, dgc] = doorCandidates[Math.floor(doorCandidates.length / 2)];
  const doorProps = (half) => ({
    facing: "south",
    half,
    hinge: "left",
    open: "false",
    powered: "false",
  });
  g.set(dx, dgc + 1, dz, "dark_oak_door", doorProps("lower"));
  g.set(dx, dgc + 2, dz, "dark_oak_door", doorProps("upper"));
  // Hanging lantern under the lintel above the door
  g.set(dx, dgc + 3, dz, "lantern", { hanging: "true", waterlogged: "false" });
}

// Rooftop plant box on interior roof cells (sits on the y 10 roof slab)
for (const [x, z] of [
  [3, 3], [4, 3], [3, 4], [4, 4],
]) {
  const gr = occ.get(key(x, z));
  if (gr === undefined) continue;
  const ext = exteriorFaces(x, z);
  if (ext.length) continue;
  g.set(x, 11, z, "light_gray_concrete");
  g.set(x, 12, z, "light_gray_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
