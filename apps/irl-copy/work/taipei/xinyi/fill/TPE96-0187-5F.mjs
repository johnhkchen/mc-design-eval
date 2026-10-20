import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE96-0187-5F";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 6, H = 38, D = 10;
const g = new Voxels([W, H, D]);

// Lowest ground under the footprint; storeys and roof are level across the building.
const minG = Math.min(...cells.map((c) => c[2]));
const STOREY = 5;
const STOREYS = 5;
const ROOF_TOP = minG + STOREY * STOREYS; // roof cap sits at y = minG+25 (top of block 25 -> 26 high)
const top = ROOF_TOP;

const key = (x, z) => `${x},${z}`;
const groundAt = new Map(cells.map(([x, z, gr]) => [key(x, z), gr]));

// Outward faces: which neighbours are not part of the footprint.
const DIRS = [
  { name: "west", dx: -1, dz: 0, along: "z" },
  { name: "east", dx: 1, dz: 0, along: "z" },
  { name: "north", dx: 0, dz: -1, along: "x" },
  { name: "south", dx: 0, dz: 1, along: "x" },
];

function missingFaces(x, z) {
  return DIRS.filter((d) => !groundAt.has(key(x + d.dx, z + d.dz)));
}

function put(x, y, z, name, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, name, props);
  else g.set(x, y, z, name);
}

// Pass 1: foundations, floor slabs, roof, facades.
for (const [x, z, gr] of cells) {
  const faces = missingFaces(x, z);
  const perim = faces.length > 0;
  const faceDir = faces[0];
  const along = faceDir ? (faceDir.along === "z" ? z : x) : 0;

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  for (let y = gr; y <= top; y++) {
    const rel = y - minG;

    if (y === top) {
      put(x, y, z, perim ? "white_concrete" : "light_gray_concrete");
      continue;
    }

    if (rel % STOREY === 0) {
      // Storey floor line (slab / spandrel).
      put(x, y, z, perim ? "white_concrete" : "light_gray_concrete");
      continue;
    }

    if (!perim) continue; // interior stays air behind the glass

    const k = Math.floor(rel / STOREY); // storey index
    const r = rel % STOREY;             // 1..4 inside the storey

    if (k === 0 && r === 1) {
      // Granite base course on the ground storey.
      put(x, y, z, "polished_granite");
      continue;
    }
    if (r === 4) {
      // Transom frame at the head of each window band.
      put(x, y, z, "light_gray_concrete");
      continue;
    }
    if (Math.abs(along) >= 0 && along % 2 === 0) {
      // Vertical mullion.
      put(x, y, z, "light_gray_concrete");
      continue;
    }
    // Glass pane; a few upper-storey panes carry warm glowstone behind them.
    if (k >= 1 && r === 2 && (along + k) % 5 === 1) {
      put(x, y, z, "glowstone");
    } else {
      put(x, y, z, "light_blue_stained_glass");
    }
  }
}

// Pass 2: ground-floor entrance on the lowest-ground outward face.
const L0 = minG;
const doorCands = cells
  .filter(([x, z, gr]) => gr <= L0 + 1 && missingFaces(x, z).length > 0)
  .map(([x, z, gr]) => {
    const f = missingFaces(x, z)[0];
    const a = f.along === "z" ? z : x;
    return { x, z, gr, f, a };
  });

if (doorCands.length) {
  const alongs = doorCands.map((c) => c.a);
  const mid = (Math.min(...alongs) + Math.max(...alongs)) / 2;
  doorCands.sort((p, q) =>
    p.gr - q.gr || Math.abs(p.a - mid) - Math.abs(q.a - mid)
  );
  const d = doorCands[0];
  const facing = d.f.name;
  put(d.x, L0 + 1, d.z, "dark_oak_door", {
    facing,
    half: "lower",
    hinge: "left",
    open: "false",
    powered: "false",
  });
  put(d.x, L0 + 2, d.z, "dark_oak_door", {
    facing,
    half: "upper",
    hinge: "left",
    open: "false",
    powered: "false",
  });
  // Lintel above the door, part of the ground-floor transom band.
  put(d.x, L0 + 4, d.z, "light_gray_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
