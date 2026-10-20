import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542014190";
const W = 17, H = 23, D = 12;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// ---- footprint lookup -------------------------------------------------------
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const B = Math.min(...cells.map((c) => c[2]));          // lowest ground = base of the building

// Faces: outward direction and the along-facade index used for bay rhythm
const FACES = [
  { name: "north", dx: 0, dz: -1, along: (x) => x },
  { name: "south", dx: 0, dz: 1, along: (x) => x },
  { name: "west", dx: -1, dz: 0, along: (x, z) => z },
  { name: "east", dx: 1, dz: 0, along: (x, z) => z },
];
const outsOf = (x, z) => FACES.filter((f) => !has(x + f.dx, z + f.dz));
const isPerim = (x, z) => has(x, z) && outsOf(x, z).length > 0;

// Materials: 1980s Taipei mid-rise commercial block; white tiled concrete,
// stone base, stone-band storey lines, blue-tinted glazing, shopfront glass.
const M = {
  base: "stone_bricks",
  facade: "white_concrete",
  band: "polished_andesite",
  pier: "light_gray_concrete",
  roof: "gray_concrete",
  floor: "light_gray_concrete",
  glass: "glass",
  pane: "light_blue_stained_glass_pane",
  parapet: "stone_brick_slab",
  light: "glowstone",
  lightAlt: "shroomlight",
  ac: "iron_block",
};

// ---- entrance: south face, closest to the centre line ----------------------
const doorCands = cells
  .filter(([x, z]) => {
    const o = outsOf(x, z);
    return o.length === 1 && o[0].name === "south";
  })
  .sort((a, b) => Math.abs(a[0] - Math.floor(W / 2)) - Math.abs(b[0] - Math.floor(W / 2)));
const door = doorCands.length ? { x: doorCands[0][0], z: doorCands[0][1], gr: doorCands[0][2] } : null;

// ---- build every footprint cell ---------------------------------------------
for (const [x, z, gr] of cells) {
  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, M.base);

  const outs = outsOf(x, z);

  // interior cell: floor slab at ground, storey slab, roof deck, AC plant
  if (outs.length === 0) {
    g.set(x, gr, z, M.floor);
    if (B + 5 > gr) g.set(x, B + 5, z, M.floor);
    if (B + 10 > gr) g.set(x, B + 10, z, M.roof);
    if ((x * 5 + z * 3) % 11 === 0 && B + 11 > gr) g.set(x, B + 11, z, M.ac);
    continue;
  }

  const corner = outs.length >= 2;
  const face = outs[0];
  const a = corner ? 0 : face.along(x, z);
  const isDoor = door && door.x === x && door.z === z && !corner;

  for (let y = gr; y <= B + 11; y++) {
    // roof edge: stone slab parapet
    if (y === B + 11) { g.set(x, y, z, M.parapet, { type: "bottom", waterlogged: "false" }); continue; }
    // cornice at roof line
    if (y === B + 10) { g.set(x, y, z, M.band); continue; }
    // storey line between the two storeys
    if (y === B + 5) { g.set(x, y, z, M.band); continue; }
    // corner columns run the full height
    if (corner) { g.set(x, y, z, M.pier); continue; }

    // ground storey: base course, shopfront, lintel
    if (y <= B + 4) {
      if (isDoor && (y === gr || y === gr + 1)) {
        const half = y === gr ? "lower" : "upper";
        g.set(x, y, z, "dark_oak_door", {
          facing: "south", half, hinge: "left", open: "false", powered: "false",
        });
        continue;
      }
      if (y === B) { g.set(x, y, z, M.base); continue; }
      if (y === B + 4) { g.set(x, y, z, M.band); continue; }
      const pier = a % 4 === 0;
      if (pier) { g.set(x, y, z, M.pier); continue; }
      g.set(x, y, z, M.glass);
      if (y === B + 2 && (x + z) % 4 === 0) placeLight(x, z, face, M.light, B + 2, gr);
      continue;
    }

    // upper storey: punched window bands between piers
    if (a % 3 !== 0) {
      const props = face.name === "north" || face.name === "south"
        ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
        : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
      g.set(x, y, z, M.pane, props);
      if (y === B + 7 && (x * 2 + z) % 5 === 0) placeLight(x, z, face, M.lightAlt, B + 7, gr);
    } else {
      g.set(x, y, z, M.facade);
    }
  }
}

// Warm light on the inside of a window: the interior cell just behind the glass
function placeLight(x, z, face, id, yl, gr) {
  const ix = x - face.dx, iz = z - face.dz;
  if (!has(ix, iz) || isPerim(ix, iz)) return;
  if (yl <= gr) return;
  g.set(ix, yl, iz, id);
}

g.save(`${DIR}/${ID}.nbt`);
