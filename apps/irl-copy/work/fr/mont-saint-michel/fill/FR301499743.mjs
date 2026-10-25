import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499743";
const W = 10, H = 24, D = 11;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const cellMap = new Map(cells.map((c) => [key(c[0], c[1]), c]));
const has = (x, z) => cellMap.has(key(x, z));
const isEdge = (x, z) => !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);

// Building-wide levels so storeys and roof stay flat.
const grounds = cells.map((c) => c[2]).sort((a, b) => a - b);
const roofs = cells.map((c) => c[3]).sort((a, b) => a - b);
const B = grounds[0];                                   // base of storey 1
const TOP = Math.min(H - 2, roofs[Math.floor(roofs.length / 2)]); // flat roof level (exclusive)

const DOOR_U = 5;

function faceOf(x, z) {
  if (!has(x, z - 1)) return { face: "north", u: x };
  if (!has(x, z + 1)) return { face: "south", u: x };
  if (!has(x - 1, z)) return { face: "west", u: z };
  if (!has(x + 1, z)) return { face: "east", u: z };
  return null;
}

// Row classification at absolute height y for an edge cell.
function edgeKind(x, z, y) {
  if (y >= TOP - 2) return "cap";
  const rel = y - B;
  const r = ((rel % 5) + 5) % 5;
  const s = Math.floor(rel / 5);
  const f = faceOf(x, z);
  if (!f) return "solid";
  if (r === 0) return "base";
  if (r === 4) return "band";
  if (s === 0 && f.face === "north" && f.u === DOOR_U && (r === 1 || r === 2)) return "door";
  if (f.u % 3 === 0) return "pillar";
  return "glass";
}

// Interior cell behind a window pane gets an air gap (only if enclosed by solid floors).
function behindGlass(x, z, y) {
  if (y >= TOP - 2) return false;
  const r = (((y - B) % 5) + 5) % 5;
  if (r < 1 || r > 3) return false;
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, nz = z + dz;
    if (!has(nx, nz) || !isEdge(nx, nz)) continue;
    if (edgeKind(nx, nz, y) === "glass") return true;
  }
  return false;
}

for (const [x, z, gy] of cells) {
  const edge = isEdge(x, z);

  // Foundation from y0 up to this cell's ground.
  for (let y = 0; y < gy; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gy; y < TOP; y++) {
    if (y >= TOP - 2) {
      // Cornice and parapet: full blocks, flat roof cap inside.
      if (edge) g.set(x, y, z, "smooth_stone");
      else g.set(x, y, z, y === TOP - 1 ? "stone_bricks" : "smooth_stone");
      continue;
    }

    if (edge) {
      const kind = edgeKind(x, z, y);
      const rel = y - B;
      const s = Math.floor(rel / 5);
      if (kind === "base") {
        g.set(x, y, z, s === 0 ? "stone_bricks" : "smooth_stone");
      } else if (kind === "band") {
        g.set(x, y, z, "smooth_stone");
      } else if (kind === "door") {
        const r = ((rel % 5) + 5) % 5;
        g.set(x, y, z, "spruce_door", {
          facing: "north",
          half: r === 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
      } else if (kind === "pillar") {
        g.set(x, y, z, "stone_bricks");
      } else if (kind === "glass") {
        g.set(x, y, z, "white_stained_glass_pane");
      } else {
        g.set(x, y, z, "smooth_stone");
      }
    } else {
      if (behindGlass(x, z, y)) {
        const rel = y - B;
        const r = ((rel % 5) + 5) % 5;
        const s = Math.floor(rel / 5);
        if (r === 2 && ((x * 7 + z * 3 + s) % 4 === 1)) g.set(x, y, z, "glowstone");
        // otherwise air gap behind the pane
      } else {
        g.set(x, y, z, "smooth_stone");
      }
    }
  }

  // Simple rooftop plant box on a few interior cells, sitting on the roof.
  if (!edge && x >= 2 && x <= 3 && z >= 2 && z <= 3 && TOP < H) {
    g.set(x, TOP, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
