import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1071343876";
const W = 18, H = 23, D = 17;

// Two-storey post-war reinforced-concrete shophouse with a stone-clad base and cornice,
// shopfront glazing at street level, and a small stair penthouse on the roof.
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cellList = Array.isArray(raw) ? raw : (raw.cells ?? []);

const parsed = cellList.map((c) =>
  Array.isArray(c) ? [c[0], c[1], c[2]] : [c.x, c.z, c.ground]
);
const minH = Math.min(...parsed.map((c) => c[2]));
const gnd = new Map();
for (const [x, z, h] of parsed) {
  gnd.set(`${x},${z}`, Math.max(0, Math.round(h - minH)));
}

const has = (x, z) => gnd.has(`${x},${z}`);
const DIRS = [
  { name: "N", dx: 0, dz: -1 },
  { name: "S", dx: 0, dz: 1 },
  { name: "W", dx: -1, dz: 0 },
  { name: "E", dx: 1, dz: 0 },
];
const exteriorFaces = (x, z) => DIRS.filter((d) => !has(x + d.dx, z + d.dz));
const isInterior = (x, z) => has(x, z) && exteriorFaces(x, z).length === 0;

const g = new Voxels([W, H, D]);

const paneProps = (f) =>
  f.dz !== 0
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };

// Foundation, walls, floor slabs and window grids
for (const [key, G] of gnd) {
  const [x, z] = key.split(",").map(Number);
  const faces = exteriorFaces(x, z);
  const exterior = faces.length > 0;
  const corner = faces.length >= 2;

  // Foundation up to this cell's ground
  for (let y = 0; y < G; y++) g.set(x, y, z, "stone_bricks");

  if (!exterior) {
    // Floor deck at second storey and roof deck
    for (const y of [5, 10]) if (y >= G) g.set(x, y, z, "smooth_stone");
    continue;
  }

  // Solid wall column from ground to the cornice
  for (let y = G; y <= 10; y++) g.set(x, y, z, "white_concrete");

  // Base course, storey bands, cornice and parapet cap
  if (G <= 0) g.set(x, 0, z, "stone_bricks");
  for (const y of [4, 5, 10]) if (y >= G) g.set(x, y, z, "stone_bricks");
  g.set(x, 11, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });

  if (!corner) {
    const f = faces[0];
    const along = f.dz !== 0 ? x : z;
    const isPier = along % 3 === 0;
    if (!isPier) {
      const ix = x - f.dx, iz = z - f.dz; // inward neighbour
      const innerOk = has(ix, iz) && isInterior(ix, iz);

      // Shopfront glazing on the ground storey
      for (const y of [1, 2, 3]) {
        if (y >= G) g.set(x, y, z, "glass_pane", paneProps(f));
      }
      // Upper storey window grid
      for (const y of [6, 7, 8]) {
        if (y >= G) g.set(x, y, z, "glass_pane", paneProps(f));
      }
      // Warm lights just behind some glass
      if (innerOk && along % 6 === 1) g.set(ix, 7, iz, "shroomlight");
      if (innerOk && along % 6 === 4) g.set(ix, 2, iz, "glowstone");
    }
  }
}

// Street entrance on the south face, near its middle
const south = [...gnd.keys()]
  .map((k) => k.split(",").map(Number))
  .filter(([x, z]) => exteriorFaces(x, z).some((d) => d.name === "S") && !exteriorFaces(x, z).some((d) => d.name !== "S"));
if (south.length) {
  const xs = south.map((c) => c[0]);
  const mid = Math.floor((Math.min(...xs) + Math.max(...xs)) / 2);
  const cand = south.find((c) => c[0] === mid) ?? south[0];
  const [dx, dz] = cand;
  const G = gnd.get(`${dx},${dz}`);
  g.set(dx, G, dz, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(dx, G + 1, dz, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  // Entrance surround: stone slab lintel just above the door
  g.set(dx, G + 2, dz, "stone_bricks");
}

// Roof: stair penthouse on the centre, rooftop plant on the north-west
const pxMin = 7, pxMax = 10, pzMin = 6, pzMax = 9;
for (let x = pxMin; x <= pxMax; x++) {
  for (let z = pzMin; z <= pzMax; z++) {
    if (!isInterior(x, z)) continue;
    const edge = x === pxMin || x === pxMax || z === pzMin || z === pzMax;
    for (let y = 11; y <= 13; y++) {
      if (edge) g.set(x, y, z, "white_concrete");
    }
    g.set(x, 14, z, "smooth_stone");
  }
}
// Pale condenser units on the roof
for (const [x, z] of [[2, 2], [3, 2], [2, 3]]) {
  if (isInterior(x, z)) g.set(x, 11, z, "light_gray_concrete");
}
// Warm beacon on the penthouse roof
if (isInterior(9, 8)) g.set(9, 15, 8, "lantern", { hanging: "false", waterlogged: "false" });

g.save(`${DIR}/${ID}.nbt`);
