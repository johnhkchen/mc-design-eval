import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE98-0292-7F";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 13, H = 47, D = 18;
const ROOF = 35;        // roof deck level (7 storeys x 5 blocks)
const PARAPET = 36;     // parapet top course
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gr = (x, z) => ground.get(`${x},${z}`);

const FACES = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const exteriorFaces = (x, z) => FACES.filter(([dx, dz]) => !has(x + dx, z + dz));

// Entrance on the z = 0 street face, centre of the frontage
const isEntrance = (x, z) => z === 0 && x >= 5 && x <= 7 && has(x, z);

// ---------- Pass 1: foundations, walls, floors ----------
for (const [x, z, gc] of cells) {
  for (let y = 0; y < gc; y++) g.set(x, y, z, "stone_bricks");

  const faces = exteriorFaces(x, z);
  const ext = faces.length > 0;

  if (!ext) {
    for (let y = gc; y <= ROOF - 1; y++) {
      if (y === gc || y % 5 === 0) g.set(x, y, z, "smooth_quartz");
    }
    continue;
  }

  const primary = faces.find(([dx, dz]) => dz !== 0) ?? faces[0];
  const [, pdz] = primary;
  const t = pdz !== 0 ? x : z;
  const cornerCell = faces.length > 1;
  const windowColumn = !cornerCell && t % 3 === 1;
  // pilasters: corners and every third bay (t % 3 === 0), drawn in quartz
  const pilaster = cornerCell || (!windowColumn && t % 3 === 0);

  for (let y = gc; y <= ROOF - 1; y++) {
    if (isEntrance(x, z)) {
      if (y <= gc + 2) { g.set(x, y, z, "glass"); continue; }
      if (y === gc + 3) { g.set(x, y, z, "dark_oak_planks"); continue; }
    }
    if (y === gc) { g.set(x, y, z, "stone_bricks"); continue; }

    const band = y % 5;
    if (band === 0) { g.set(x, y, z, "smooth_quartz"); continue; }          // storey line
    if (pilaster) { g.set(x, y, z, "smooth_quartz"); continue; }             // vertical rhythm
    if ((band === 2 || band === 3) && windowColumn) {
      g.set(x, y, z, "light_blue_stained_glass_pane");                       // glazing
      continue;
    }
    // spandrels: light grey, so window bands read against the cream wall
    if (band === 1 || band === 4) g.set(x, y, z, "light_gray_concrete");
    else g.set(x, y, z, "white_concrete");
  }
}

// ---------- Pass 2: warm lights behind some windows ----------
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const faces = exteriorFaces(x, z);
  if (faces.length === 0 || faces.length > 1 || isEntrance(x, z)) continue;
  const [dx, dz] = faces[0];
  const t = dz !== 0 ? x : z;
  if (t % 3 !== 1) continue;
  const gc = gr(x, z);
  for (let k = 0; k < ROOF / 5; k++) {
    const y = k * 5 + 2;
    if (y < gc + 1) continue;
    if (((x * 7 + z * 13 + k * 5) % 5) !== 0) continue;
    const ix = x - dx, iz = z - dz;
    if (!has(ix, iz)) continue;
    if (y < gr(ix, iz) + 1) continue;
    g.set(x, y, z, "light_blue_stained_glass_pane");
    g.set(ix, y, iz, "glowstone");
  }
}

// lobby lanterns standing on the lobby floor behind the entrance glass
for (const x of [5, 6, 7]) {
  if (!has(x, 1)) continue;
  if (exteriorFaces(x, 1).length) continue;
  g.set(x, gr(x, 1) + 1, 1, "lantern");
}

// ---------- Pass 3: roof deck, parapet and cornice ----------
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const ext = exteriorFaces(x, z).length > 0;
  if (ext) {
    g.set(x, ROOF, z, "smooth_quartz");
    g.set(x, PARAPET, z, "white_concrete");
  } else {
    g.set(x, ROOF, z, "gray_concrete");
  }
}

// ---------- Pass 4: setback mechanical penthouse ----------
const PH_X0 = 3, PH_X1 = 9, PH_Z0 = 4, PH_Z1 = 13;
const PH_TOP = 40;
for (let x = PH_X0; x <= PH_X1; x++) {
  for (let z = PH_Z0; z <= PH_Z1; z++) {
    if (!has(x, z)) continue;
    const edge = x === PH_X0 || x === PH_X1 || z === PH_Z0 || z === PH_Z1;
    g.set(x, PH_TOP, z, edge ? "smooth_quartz" : "light_gray_concrete");
    if (!edge) continue;
    const t = (x === PH_X0 || x === PH_X1) ? z : x;
    for (let y = ROOF + 1; y <= PH_TOP - 1; y++) {
      if (y === ROOF + 1 || y === PH_TOP - 1) { g.set(x, y, z, "light_gray_concrete"); continue; }
      if (t % 2 === 0) g.set(x, y, z, "light_blue_stained_glass_pane");
      else g.set(x, y, z, "light_gray_concrete");
    }
  }
}

if (has(6, 10)) {
  g.set(6, PH_TOP + 1, 10, "sea_lantern");
  g.set(6, PH_TOP + 2, 10, "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);
