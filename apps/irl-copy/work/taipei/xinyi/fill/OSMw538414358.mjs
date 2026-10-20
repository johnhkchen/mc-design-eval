import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no tags. Decided from the lidar roof height (~11 blocks) and the footprint:
// a two-storey mid-century Taipei commercial block (1960s-80s): white-painted concrete frame,
// quartz piers, a stone plinth, a glazed shopfront with a central door, an upper storey of
// glazed bays, a cornice and a stepped parapet, and a flat roof with a plant box.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538414358";
const W = 21, H = 23, D = 22;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cells = Array.isArray(raw) ? raw : raw.cells;

const ground = new Map();
let base = Infinity;
for (const [x, z, gc] of cells) {
  ground.set(`${x},${z}`, gc);
  base = Math.min(base, gc);
}
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const facesOf = (x, z) => Object.keys(DIRS).filter(f => !has(x + DIRS[f][0], z + DIRS[f][1]));

// Level plan (absolute y, base = lowest ground):
//  gc        plinth (stone bricks)
//  base+1..3 shopfront glass / door
//  base+4    shopfront fascia (gray concrete)
//  base+5    storey line (quartz)
//  base+6..8 upper glazing, head frame at base+8
//  base+9    cornice (quartz) / roof deck (gray concrete) inside
//  base+10   parapet (white concrete)
//  base+11   parapet cap (quartz)   -> roof at 11 above lowest ground
const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const pierFor = (x, z, face) => {
  const along = face === "north" || face === "south";
  const t = along ? x : z;
  const nb = along ? [[x - 1, z], [x + 1, z]] : [[x, z - 1], [x, z + 1]];
  return t % 3 === 0 || nb.some(([a, b]) => !has(a, b));
};

const paneProps = (face) => {
  const along = face === "north" || face === "south";
  return along
    ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
};

// Entry: on the north face (else south), the non-pier cell nearest the face's mean x.
const perimCells = cells.filter(([x, z]) => facesOf(x, z).length > 0);
let entryFace = ["north", "south", "west", "east"].find(f =>
  perimCells.some(([x, z]) => facesOf(x, z).includes(f)));
const entryCands = perimCells.filter(([x, z]) =>
  facesOf(x, z).includes(entryFace) && !pierFor(x, z, entryFace));
const meanT = entryCands.reduce((s, [x, z]) =>
  s + (entryFace === "north" || entryFace === "south" ? x : z), 0) / Math.max(1, entryCands.length);
let entry = null, best = Infinity;
for (const [x, z] of entryCands) {
  const t = entryFace === "north" || entryFace === "south" ? x : z;
  if (Math.abs(t - meanT) < best) { best = Math.abs(t - meanT); entry = [x, z]; }
}
const entryKey = entry ? `${entry[0]},${entry[1]}` : null;

const primary = new Map();

for (const [x, z, gc] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gc; y++) put(x, y, z, "stone_bricks");

  const faces = facesOf(x, z);
  const isPerim = faces.length > 0;

  // Storey line and roof deck, all footprint cells.
  if (base + 5 >= gc) put(x, base + 5, z, "smooth_quartz");
  if (base + 9 >= gc) put(x, base + 9, z, isPerim ? "smooth_quartz" : "gray_concrete");

  if (!isPerim) continue;

  const face = faces[0];
  primary.set(`${x},${z}`, face);
  const pier = pierFor(x, z, face);
  const isEntry = `${x},${z}` === entryKey;

  for (let y = gc; y <= base + 11; y++) {
    if (y === base + 11) put(x, y, z, "smooth_quartz");
    else if (y === base + 10) put(x, y, z, "white_concrete");
    else if (y === base + 9) put(x, y, z, "smooth_quartz");
    else if (y === base + 5) put(x, y, z, "smooth_quartz");
    else if (y === gc) put(x, y, z, "stone_bricks");
    else if (y <= base + 4) {
      // Ground storey shopfront.
      if (pier) put(x, y, z, "smooth_quartz");
      else if (y === base + 4) put(x, y, z, "gray_concrete");
      else if (isEntry && y <= base + 2) {
        put(x, y, z, "oak_door", {
          facing: entryFace,
          half: y === base + 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
      } else if (isEntry && y === base + 3) put(x, y, z, "gray_concrete");
      else put(x, y, z, "glass_pane", paneProps(face));
    } else {
      // Upper storey glazing bays.
      if (pier) put(x, y, z, "smooth_quartz");
      else if (y === base + 8) put(x, y, z, "gray_concrete");
      else put(x, y, z, "glass_pane", paneProps(face));
    }
  }
}

// Warm lights behind some glass, only where the inside cell is open interior.
for (const [x, z, gc] of cells) {
  const face = primary.get(`${x},${z}`);
  if (!face || pierFor(x, z, face)) continue;
  const [dx, dz] = DIRS[face];
  const ix = x - dx, iz = z - dz;
  if (!has(ix, iz) || facesOf(ix, iz).length > 0) continue;
  if ((x * 7 + z * 3) % 5 === 0) put(ix, base + 7, iz, "shroomlight");
  else if ((x + z) % 4 === 0 && base + 2 >= gc) put(ix, base + 2, iz, "glowstone");
}

// Roof plant: a low equipment box on the interior of the roof deck.
for (const [x, z, gc] of cells) {
  if (facesOf(x, z).length > 0) continue;
  if (x >= 8 && x <= 12 && z >= 8 && z <= 13 && gc <= base + 9) {
    put(x, base + 10, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
