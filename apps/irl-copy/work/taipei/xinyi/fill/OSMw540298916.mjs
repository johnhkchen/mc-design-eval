import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: 24 x 20 footprint, roof ~11 blocks above the lowest ground.
// Read as a two-storey, cream-faced commercial block (1990s-2000s Xinyi
// shophouse / office annex): ground-floor shopfront, upper storey of
// glazed bays between quartz piers, a cornice, and a parapet with a
// roof deck and plant boxes.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540298916";
const W = 24, H = 23, D = 20;
const ROOF = 11;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const clamp = (v) => Math.min(10, Math.max(0, Math.round(v)));

const minX = Math.min(...cells.map((c) => c[0]));
const minZ = Math.min(...cells.map((c) => c[1]));

// Outward faces of a footprint cell (a face exists where the neighbour is outside the footprint).
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const facesOf = (x, z) =>
  Object.entries(DIRS)
    .filter(([, [dx, dz]]) => !has(x + dx, z + dz))
    .map(([k]) => k);

// Choose the entrance: a single-face cell on the north (street) face, near the middle.
let cand = cells.filter(([x, z]) => {
  const f = facesOf(x, z);
  return f.length === 1 && f[0] === "N";
});
let entranceFace = "N";
if (cand.length === 0) {
  cand = cells.filter(([x, z]) => facesOf(x, z).length >= 1);
  entranceFace = cand.length ? facesOf(cand[0][0], cand[0][1])[0] : "N";
}
cand.sort((a, b) => (a[0] - b[0]) || (a[1] - b[1]));
const entrance = cand.length ? cand[Math.floor(cand.length / 2)] : null;
const entranceKey = entrance ? `${entrance[0]},${entrance[1]}` : null;

const FACING = { N: "north", S: "south", W: "west", E: "east" };

for (const [x, z, gr0] of cells) {
  const gr = clamp(gr0);
  const fc = facesOf(x, z);
  const edge = fc.length > 0;
  const corner = fc.length > 1;
  // Index along the facade, for bay rhythm.
  const i = fc.includes("N") || fc.includes("S") ? x - minX : z - minZ;

  // Foundation from y 0 up to the cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gr; y <= ROOF; y++) {
    let b = null;
    let p;
    if (y === gr) {
      // Ground floor slab / base course.
      b = edge ? "polished_andesite" : "smooth_stone";
    } else if (y < 5) {
      // Ground storey: shopfront glazing between quartz piers, fascia at y=4.
      if (!edge) b = null;
      else if (y === 4) b = "polished_andesite";
      else if (corner || i % 3 === 0) { b = "quartz_pillar"; p = { axis: "y" }; }
      else b = "glass";
    } else if (y === 5) {
      // Storey line.
      b = edge ? "smooth_quartz" : "smooth_stone";
    } else if (y < 10) {
      // Upper storey: cyan glazing in quartz frames, spandrels at y=6 and y=9.
      if (!edge) b = null;
      else if (corner || i % 3 === 0) { b = "quartz_pillar"; p = { axis: "y" }; }
      else if (y === 6 || y === 9) b = "smooth_quartz";
      else b = "cyan_stained_glass";
    } else if (y === 10) {
      // Cornice on the edge, roof deck inside.
      b = edge ? "smooth_quartz" : "gray_concrete";
    } else if (y === ROOF) {
      // Parapet with rhythm of piers.
      if (edge) {
        if (corner || i % 3 === 0) { b = "quartz_pillar"; p = { axis: "y" }; }
        else b = "smooth_quartz";
      }
    }
    if (b) g.set(x, y, z, b, p);
  }

  // Warm light behind some upper windows (inside, one cell in from the face).
  if (edge && !corner && gr < 10 && i % 6 === 1) {
    const out = fc[0];
    const [dx, dz] = DIRS[out];
    const ix = x - dx, iz = z - dz;
    if (has(ix, iz) && gr + 2 < 7) {
      g.set(ix, 7, iz, "shroomlight");
    }
  }

  // Roof plant boxes on interior cells.
  if (!edge && gr <= 10 && ((x * 7 + z * 3) % 9 === 0)) {
    g.set(x, ROOF, z, "light_gray_concrete");
    g.set(x, ROOF + 1, z, "light_gray_concrete");
  }
}

// Entrance: double door in the street-face ground storey, lintel above.
if (entrance) {
  const [ex, ez, egr0] = entrance;
  const egr = clamp(egr0);
  const facing = FACING[entranceFace] ?? "north";
  if (egr + 2 <= 4) {
    g.set(ex, egr + 1, ez, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(ex, egr + 2, ez, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
    g.set(ex, egr + 3, ez, "smooth_quartz");
  }
}

g.save(`${DIR}/${ID}.nbt`);
