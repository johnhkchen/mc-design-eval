import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: 21 x 18 footprint, roof ~26 blocks above lowest ground.
// Read as a five-storey 1990s Xinyi commercial/office block: stone base,
// shopfront on the ground storey, pale wall piers, tinted glass bays with
// warm light behind some panes, quartz fascia and parapet, plant on the roof.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw826989995";
const W = 21, H = 38, D = 18;
const STOREY = 5;
const ROOF_RISE = 26;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const occ = new Map();
for (const [x, z, gr] of cells) occ.set(key(x, z), Math.round(gr));

const minG = Math.min(...cells.map((c) => Math.round(c[2])));
const roofY = minG + ROOF_RISE;

// Bounds-guarded setter; props optional.
const put = (x, y, z, b, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Outward faces of a footprint cell (neighbour missing from footprint).
const facesOf = (x, z) => {
  const f = [];
  if (!occ.has(key(x, z - 1))) f.push({ name: "N", dx: 0, dz: -1, facing: "north" });
  if (!occ.has(key(x, z + 1))) f.push({ name: "S", dx: 0, dz: 1, facing: "south" });
  if (!occ.has(key(x - 1, z))) f.push({ name: "W", dx: -1, dz: 0, facing: "west" });
  if (!occ.has(key(x + 1, z))) f.push({ name: "E", dx: 1, dz: 0, facing: "east" });
  return f;
};

// Entrance: middle of the north-facing (lowest z) perimeter run.
const northCells = cells
  .filter(([x, z]) => !occ.has(key(x, z - 1)))
  .map(([x, z]) => x)
  .sort((a, b) => a - b);
const doorX = northCells.length ? northCells[Math.floor(northCells.length / 2)] : -1;
const doorKey = northCells.length
  ? key(doorX, cells.find(([x, z]) => x === doorX && !occ.has(key(x, z - 1)))[1])
  : null;

const lights = [];

for (const [cx, cz, cg0] of cells) {
  const x = cx, z = cz, gr = Math.round(cg0);
  const faces = facesOf(x, z);
  const perimeter = faces.length > 0;
  const face = faces[0];

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  for (let y = gr; y <= roofY; y++) {
    const rel = y - gr;

    if (y === roofY) {
      put(x, y, z, "light_gray_concrete");
      continue;
    }

    const band = rel % STOREY;
    const ground = rel < STOREY;

    if (!perimeter) {
      // Interior: floor slab per storey, air otherwise.
      if (band === 0) put(x, y, z, "light_gray_concrete");
      continue;
    }

    const along = face.name === "N" || face.name === "S" ? x : z;

    if (ground) {
      if (band === 0) {
        put(x, y, z, "polished_andesite");
      } else if (band === 4) {
        put(x, y, z, "smooth_quartz");
      } else if (key(x, z) === doorKey && (band === 1 || band === 2)) {
        put(x, y, z, "oak_door", {
          facing: face.facing,
          half: band === 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
      } else if (along % 3 === 0) {
        put(x, y, z, "white_concrete"); // shopfront pier
      } else {
        put(x, y, z, "glass"); // shopfront glazing
      }
      continue;
    }

    // Upper storeys.
    if (band === 0) {
      put(x, y, z, "light_gray_concrete"); // storey line
    } else if (band === 4) {
      put(x, y, z, "smooth_quartz"); // spandrel
    } else if (along % 3 === 0) {
      put(x, y, z, "white_concrete"); // wall pier
    } else {
      put(x, y, z, "light_blue_stained_glass"); // window
      // Warm light behind some panes.
      if ((along + rel) % 7 === 2) {
        const ix = x - face.dx, iz = z - face.dz;
        if (occ.has(key(ix, iz))) lights.push([ix, y, iz]);
      }
    }
  }

  // Parapet on the roof edge.
  if (perimeter) put(x, roofY + 1, z, "smooth_quartz");
}

// Roof plant room in the middle of the roof.
for (const [x, z] of cells) {
  if (x >= Math.floor(W * 0.3) && x <= Math.ceil(W * 0.7) &&
      z >= Math.floor(D * 0.3) && z <= Math.ceil(D * 0.7)) {
    put(x, roofY + 1, z, "gray_concrete");
    put(x, roofY + 2, z, "gray_concrete");
    if ((x + z) % 2 === 0) put(x, roofY + 3, z, "stone_bricks");
  }
}

// Warm lights placed last so nothing overwrites them.
for (const [x, y, z] of lights) put(x, y, z, "glowstone");

g.save(`${DIR}/${ID}.nbt`);
