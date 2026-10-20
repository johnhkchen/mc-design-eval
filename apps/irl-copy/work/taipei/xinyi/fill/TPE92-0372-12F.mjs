import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const cells = JSON.parse(readFileSync(`${DIR}/TPE92-0372-12F.cells.json`, "utf8"));

// 2003 Xinyi office tower, footprint 53 x 43, roof ~69 above lowest ground.
// Smooth-quartz podium with shopfront glass, tower storeys of ribbon glass between
// white-concrete piers and light-grey spandrels, a mid-height quartz band, cornice,
// parapet and a mechanical penthouse on the roof.
const W = 53, H = 81, D = 43;
const ROOF = 69;            // roof top, relative to lowest ground
const STOREY = 5;           // blocks per storey
const TOP_STOREY = 13;      // cornice storey (yb = 65)
const MID_BAND = 30;        // mid-height quartz band (storey 6 base)
const g = new Voxels([W, H, D]);

const minG = Math.min(...cells.map((c) => c[2]));
const key = (x, z) => `${x},${z}`;
const cellG = new Map();
for (const [x, z, gr] of cells) cellG.set(key(x, z), gr - minG);
const has = (x, z) => cellG.has(key(x, z));

const exposure = (x, z) => ({
  N: !has(x, z - 1),
  S: !has(x, z + 1),
  W: !has(x - 1, z),
  E: !has(x + 1, z),
});
const isPerim = (x, z) => {
  const e = exposure(x, z);
  return e.N || e.S || e.W || e.E;
};
const isCorner = (x, z) => {
  const e = exposure(x, z);
  return (e.N || e.S) && (e.W || e.E);
};

// Entrance: the middle exposed cell of the first non-empty face in N, S, W, E order.
let entKey = null, entFace = null;
for (const f of ["N", "S", "W", "E"]) {
  const list = cells
    .map((c) => [c[0], c[1]])
    .filter(([x, z]) => isPerim(x, z) && exposure(x, z)[f]);
  if (list.length) {
    const alongX = f === "N" || f === "S";
    list.sort((a, b) => (alongX ? a[0] - b[0] : a[1] - b[1]));
    const m = list[Math.floor(list.length / 2)];
    entKey = key(m[0], m[1]);
    entFace = f;
    break;
  }
}
// Door faces back toward the building interior, opposite the exterior face.
const doorFacing = { N: "south", S: "north", W: "east", E: "west" };

// Roof plant zone: footprint six blocks away in all four directions.
const inset = (x, z) => has(x - 6, z) && has(x + 6, z) && has(x, z - 6) && has(x, z + 6);

const FOUNDATION = "stone";
const PLINTH = "stone_bricks";
const PODIUM_BAND = "smooth_quartz";
const SPANDREL = "light_gray_concrete";
const PIER = "white_concrete";
const GLASS = "light_blue_stained_glass";
const GLASS_ALT = "cyan_stained_glass";
const FLOOR = "light_gray_concrete";
const ROOF_SLAB = "light_gray_concrete";
const CORNICE = "smooth_quartz";
const PARAPET = "white_concrete";
const ROOF_PLANT = "light_gray_concrete";

for (const [x, z, rawG] of cells) {
  const gr = rawG - minG;
  const Y0 = STOREY * Math.ceil(gr / STOREY);   // first storey line at or above this cell's ground
  const perim = isPerim(x, z);
  const e = exposure(x, z);

  // Foundation below ground, plinth between ground and first storey line.
  for (let y = 0; y < Y0; y++) g.set(x, y, z, y < gr ? FOUNDATION : PLINTH);

  if (!perim) {
    // Interior: floor slab per storey, air between, roof slab on top.
    for (let k = 0; k <= TOP_STOREY; k++) {
      const yb = STOREY * k;
      if (yb < Y0) continue;
      g.set(x, yb, z, FLOOR);
    }
    if (68 >= Y0) g.set(x, 68, z, ROOF_SLAB);

    if (inset(x, z)) {
      for (let y = ROOF; y <= ROOF + 1; y++) g.set(x, y, z, ROOF_PLANT);
    }
    continue;
  }

  // Perimeter: facade wall, one cell thick.
  // Index runs along the exposed face: x for N/S faces, z for W/E faces.
  const alongX = e.N || e.S;
  const axisFace = alongX ? (e.N ? "N" : "S") : (e.W ? "W" : "E");
  const idx = alongX ? x : z;
  const inward = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] }[axisFace];
  const corner = isCorner(x, z);
  const isEntrance = key(x, z) === entKey;

  for (let k = 0; k <= TOP_STOREY; k++) {
    const yb = STOREY * k;
    if (yb < Y0) continue;

    if (k === TOP_STOREY) {
      // Cornice, parapet and roof cap (rows 65..68).
      g.set(x, yb, z, CORNICE);
      g.set(x, yb + 1, z, PARAPET);
      g.set(x, yb + 2, z, PARAPET);
      g.set(x, yb + 3, z, CORNICE);
      continue;
    }

    // Storey base row: quartz podium, then spandrels; the mid-height band is quartz.
    const bandRow = k < 2 || yb === MID_BAND;
    g.set(x, yb, z, bandRow ? PODIUM_BAND : SPANDREL);

    // Window rows yb+1..yb+3: piers every 3 cells, corners always solid pier.
    const pier = corner || idx % 3 === 0;
    for (let r = 1; r <= 3; r++) {
      if (pier) {
        g.set(x, yb + r, z, PIER);
      } else {
        const glass = (idx + k) % 6 === 4 ? GLASS_ALT : GLASS;
        g.set(x, yb + r, z, glass);
      }
    }

    // Top spandrel row yb+4.
    g.set(x, yb + 4, z, bandRow ? PODIUM_BAND : SPANDREL);

    // Warm light behind some windows: glowstone on the interior floor.
    if (!pier && (idx + k) % 4 === 0) {
      const ix = x + inward[0], iz = z + inward[1];
      if (has(ix, iz) && !isPerim(ix, iz)) {
        g.set(ix, yb + 1, iz, "glowstone");
      }
    }

    // Ground storey entrance: iron door on the middle cell, quartz lintel over the bay.
    if (k === 0 && isEntrance) {
      g.set(x, yb + 1, z, "iron_door", {
        facing: doorFacing[entFace],
        half: "lower",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      g.set(x, yb + 2, z, "iron_door", {
        facing: doorFacing[entFace],
        half: "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      g.set(x, yb + 3, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
    }

    // Lintel course over the other entrance-width cells on the ground storey.
    if (k === 0 && !isEntrance && entFace && e[entFace]) {
      const dist = entFace === "N" || entFace === "S"
        ? Math.abs(x - Number(entKey.split(",")[0]))
        : Math.abs(z - Number(entKey.split(",")[1]));
      if (dist <= 1) {
        g.set(x, yb + 3, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
      }
    }
  }
}

// Roof plant on the inner footprint, standing on the roof slab at y 68.
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  if (!isPerim(x, z) && inset(x, z)) {
    g.set(x, ROOF, z, ROOF_PLANT);
    g.set(x, ROOF + 1, z, ROOF_PLANT);
  }
}

g.save(`${DIR}/TPE92-0372-12F.nbt`);
