// Record: no name. Footprint 23 x 17, roof ~26 blocks above lowest ground.
// Read as a 1990s commercial/office mid-rise in Xinyi: five storeys of 5 blocks,
// white spandrels, quartz pilasters, tinted glass in a grid, stone-brick base,
// a cornice and parapet, a shopfront ground floor with a central entrance,
// and a small centred roof penthouse with a lightning rod.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw826989989";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const W = 23, H = 38, D = 17;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const minZ = Math.min(...cells.map(([, z]) => z));

const put = (x, y, z, id, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};
const isEdge = (x, z) => DIRS.some(([dx, dz]) => !has(x + dx, z + dz));

// Per-cell massing: foundation below ground, interior floor slabs, facade on edges.
for (const [x, z, gr] of cells) {
  // Foundation up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const fl = DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));
  if (fl.length === 0) {
    // Interior: floor slabs only (air gap behind glass, no interiors).
    for (let y = gr; y <= 25; y++) {
      if (y === gr || y % 5 === 0) put(x, y, z, "light_gray_concrete");
    }
    continue;
  }

  const corner = fl.length >= 2;
  const face = fl[0];
  const idx = face[0] !== 0 ? z : x;
  const ent = !corner && face[0] === 0 && face[1] === -1 && z === minZ && idx >= 10 && idx <= 12;

  for (let y = gr; y <= 26; y++) {
    const s = Math.floor(y / 5);
    const dy = y % 5;

    // Parapet on the roof edge.
    if (y === 26) {
      put(x, y, z, corner ? "smooth_quartz" : "white_concrete");
      continue;
    }

    // Floor slab/interior deck at storey lines for edge cells too.
    if (!corner && y % 5 === 0 && y > 0 && y !== 25 && !(s === 0)) {
      // spandrel handled below; slab lines coincide with dy0 spandrels
    }

    let id = null;
    let props = null;

    if (y === 24) {
      id = "smooth_quartz"; // cornice
    } else if (corner) {
      id = (s === 0 && (dy === 0 || y === gr)) ? "polished_andesite" : "smooth_quartz";
    } else if (s === 0 && (dy === 0 || y === gr)) {
      id = "polished_andesite"; // base course
    } else if (dy === 0 || y === 25) {
      id = "white_concrete"; // spandrel
    } else if (dy === 4) {
      id = "light_gray_concrete"; // storey band
    } else if (ent) {
      if (dy === 3) {
        if (idx === 11) { id = "lantern"; props = { hanging: "true", waterlogged: "false" }; }
        else id = "smooth_quartz";
      } else {
        id = null; // entrance opening (air)
      }
    } else if (idx % 3 === 0) {
      id = "smooth_quartz"; // mullion
    } else {
      id = "light_blue_stained_glass"; // glazing
    }

    if (id) put(x, y, z, id, props);

    // Warm light just inside selected windows.
    if (!corner && !ent && id === "light_blue_stained_glass" && dy === 2 && y > gr && idx % 6 === 1) {
      const ix = x - face[0], iz = z - face[1];
      if (has(ix, iz) && !isEdge(ix, iz)) put(ix, y, iz, "shroomlight");
    }
  }
}

// Roof penthouse: a centred block set on the roof deck (top of y=25).
const cx = 11, cz = 8;
const P = new Set();
for (let x = 0; x < W; x++) {
  for (let z = 0; z < D; z++) {
    if (Math.abs(x - cx) <= 4 && Math.abs(z - cz) <= 3 &&
        has(x, z) && DIRS.every(([dx, dz]) => has(x + dx, z + dz))) {
      P.add(`${x},${z}`);
    }
  }
}
for (const key of P) {
  const [x, z] = key.split(",").map(Number);
  const perim = DIRS.some(([dx, dz]) => !P.has(`${x + dx},${z + dz}`));
  put(x, 30, z, "light_gray_concrete"); // penthouse roof
  if (perim) {
    for (let y = 26; y <= 29; y++) {
      const band = y === 26 || y === 29;
      const mull = (x + z) % 3 === 0;
      put(x, y, z, band || mull ? "white_concrete" : "light_blue_stained_glass");
    }
  }
}
if (P.has(`${cx},${cz}`)) {
  put(cx, 31, cz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
