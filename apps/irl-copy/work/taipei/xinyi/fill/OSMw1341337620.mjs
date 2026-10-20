import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1341337620";
const W = 27, H = 19, D = 14;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gnd] of cells) ground.set(`${x},${z}`, gnd);
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

const minG = Math.min(...ground.values());
const maxG = Math.max(...ground.values());

// Roof sits about 7 blocks above the lowest ground; taller on the downhill side.
const R = Math.max(minG + 7, maxG + 5); // first air block above the roof
const T = R - 1;                         // top solid block of the body

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// outward directions: +z is the street face
const DIRS = [
  { dx: 1, dz: 0, name: "east" },
  { dx: -1, dz: 0, name: "west" },
  { dx: 0, dz: 1, name: "south" },
  { dx: 0, dz: -1, name: "north" },
];

for (const [x, z, G] of cells) {
  // foundation: solid from y 0 up to the cell's ground
  for (let y = 0; y < G; y++) put(x, y, z, "stone_bricks");

  const out = DIRS.filter(d => !has(x + d.dx, z + d.dz));
  const exterior = out.length > 0;
  const h = T - G + 1;

  // pick the facade this cell belongs to (street face first)
  const street = out.find(d => d.dz === 1);
  const face = street || out[0];
  const alongZ = face ? face.dx !== 0 : false; // facade runs along x when outward is +-x
  const idx = face ? (alongZ ? x : z) : 0;

  for (let r = 0; r < h; r++) {
    const y = G + r;

    if (r === 0) {
      // base course
      put(x, y, z, "polished_andesite");
      continue;
    }
    if (r === h - 1) {
      // roof cap / roof surface
      put(x, y, z, exterior ? "smooth_stone" : "light_gray_concrete");
      continue;
    }
    if (r === h - 2) {
      // parapet body on the perimeter, air inside
      if (exterior) put(x, y, z, "white_concrete");
      continue;
    }
    if (r === h - 3) {
      // cornice, also the ceiling over interiors
      put(x, y, z, "smooth_stone");
      continue;
    }
    // storey floor / string course lines every 4 blocks
    if (((r - 1) % 4) === 3) {
      put(x, y, z, "smooth_stone");
      continue;
    }
    // storey rows
    if (!exterior) continue; // interior air gap

    const isGround = r <= 3;
    const onStreet = face && face.dz === 1;

    // doors and hanging lanterns on the street face, ground storey
    if (onStreet && isGround && idx % 9 === 4) {
      if (r === 1) {
        put(x, y, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (r === 2) {
        put(x, y, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (r === 3) {
        put(x, y, z, "lantern", { hanging: "true" });
        continue;
      }
    }

    // pillars every third bay
    if (idx % 3 === 0) {
      put(x, y, z, "white_concrete");
      continue;
    }

    // glazing: clear shopfront glass at street level, tinted glass above
    const glassId = isGround && onStreet ? "glass" : "gray_stained_glass";
    put(x, y, z, glassId);

    // some windows lit: glowstone in the air gap just inside the glass
    if (!isGround && ((idx * 5 + r) % 7 === 0)) {
      const ix = x - face.dx;
      const iz = z - face.dz;
      if (has(ix, iz) && DIRS.every(d => has(ix + d.dx, iz + d.dz))) {
        put(ix, y, iz, "glowstone");
      }
    }
  }
}

// rooftop plant: a few condenser boxes on interior roof cells
for (const [x, z] of [[...ground.keys()].map(k => k.split(",").map(Number))].flat()) {
  const interior = DIRS.every(d => has(x + d.dx, z + d.dz));
  if (interior && x % 8 === 3 && z === 5) {
    put(x, T + 1, z, "gray_concrete");
    put(x, T + 2, z, "smooth_stone_slab", { type: "bottom" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
