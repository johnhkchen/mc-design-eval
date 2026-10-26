import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// DC58518: a Federal Triangle-era Classical Revival office block in pale limestone (calcite), with a polished
// plinth, a quartz belt course between the two storeys, and a quartz cornice. Walls are a 1-block skin with
// an air pocket behind each window and a solid core. Pilasters every third cell, dark glass in the bays, a
// central entrance with a pediment, and lit windows here and there. The top is lidar's roof, stepping from 6 to 5 to 4.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC58518.cells.json`, "utf8"));
const SIZE = [7, 18, 12];

const col = new Map(cells.map(([x, z, g, r]) => [`${x},${z}`, { g, r }]));
const has = (x, z) => col.has(`${x},${z}`);
const roofAt = (x, z) => col.get(`${x},${z}`).r;

// Exposed faces at height y: a neighbour that is missing, or too low to fill y, leaves the face open.
const STEP = { W: [-1, 0], E: [1, 0], N: [0, -1], S: [0, 1] };
const IN = { W: [1, 0], E: [-1, 0], N: [0, 1], S: [0, -1] };   // one cell into the building from each face
const faces = (x, z, y) => Object.keys(STEP).filter((d) => {
  const [dx, dz] = STEP[d];
  return !has(x + dx, z + dz) || roofAt(x + dx, z + dz) <= y;
});
const key = (x, y, z) => `${x},${y},${z}`;

// The plan: one entry per cell, by its band above the plinth. s = the row above the plinth (0 = first storey).
const plan = new Map();
const put = (x, y, z, kind, face = null) => plan.set(key(x, y, z), { x, y, z, kind, face });
for (const [x, z, g, r] of cells) {
  for (let y = 0; y < r; y++) {
    if (y < g) { put(x, y, z, "found"); continue; }
    if (y === g) { put(x, y, z, "plinth"); continue; }
    const s = y - (g + 1), K = r - (g + 1), top = s === K - 1;
    const fs = faces(x, z, y);
    let kind = "wall", face = fs[0] ?? null;
    if (top) kind = "cornice";
    else if (s === 2 && K >= 4) kind = "belt";
    else if (fs.length >= 2) kind = "pilaster";
    else if (fs.length === 1) {
      const onPier = fs[0] === "W" || fs[0] === "E" ? z % 3 === 1 : x % 3 === 0;
      if (onPier) kind = "pilaster";
      else if (s === 0 || s === 1 || (s === 3 && K === 5)) kind = "win";
    }
    put(x, y, z, kind, face);
  }
}

// The entrance: on the west face at z 5, two door cells, a pediment over, a lantern each side at the first storey
const gDoor = col.get("0,5").g;
put(0, gDoor + 1, 5, "door", "W");
put(0, gDoor + 2, 5, "door", "W");
put(0, gDoor + 4, 5, "pedi", "W");
put(0, gDoor + 1, 4, "lamp", "W");
put(0, gDoor + 1, 6, "lamp", "W");

// Air behind every window and door (the one cell inward, if it is a plain interior cell): the glass sits on an air gap
for (const p of [...plan.values()]) {
  if (p.kind !== "win" && p.kind !== "door") continue;
  const [dx, dz] = IN[p.face];
  const ix = p.x + dx, iz = p.z + dz;
  if (!has(ix, iz) || faces(ix, iz, p.y).length) continue;
  put(ix, p.y, iz, "air");
  // a warm light in the room, two cells in, on some windows
  if (p.kind === "win" && (p.x * 2 + p.z + p.y) % 4 === 0) {
    const gx = ix + dx, gz = iz + dz;
    if (has(gx, gz) && !faces(gx, gz, p.y).length) put(gx, p.y, gz, "glow");
  }
}

// Panes join their neighbours in the wall line (panes, piers, the entrance), so a bay reads as one frame of glass
const solid = (x, y, z) => { const p = plan.get(key(x, y, z)); return !!p && p.kind !== "air" && p.kind !== "glow"; };
const pane = (p) => {
  const ax = p.face === "W" || p.face === "E";
  const [a, b] = ax ? [solid(p.x, p.y, p.z - 1), solid(p.x, p.y, p.z + 1)] : [solid(p.x - 1, p.y, p.z), solid(p.x + 1, p.y, p.z)];
  const s = (v) => (v ? "true" : "false");
  const st = ax ? { north: s(a), south: s(b), east: "false", west: "false" } : { north: "false", south: "false", east: s(a), west: s(b) };
  return { ...st, waterlogged: "false" };
};

const g = new Voxels(SIZE);
for (const p of plan.values()) {
  const { x, y, z, kind, face } = p;
  switch (kind) {
    case "air": case "glow": break;
    case "found": g.set(x, y, z, "stone_bricks"); break;
    case "plinth": g.set(x, y, z, "polished_andesite"); break;
    case "wall": g.set(x, y, z, "calcite"); break;
    case "belt": g.set(x, y, z, "smooth_quartz"); break;
    case "pilaster": g.set(x, y, z, "smooth_quartz"); break;
    case "cornice":
      // a plain quartz cap: the chiseled alternation read as busy patterning on the sheet
      g.set(x, y, z, "smooth_quartz"); break;
    case "win": g.set(x, y, z, "gray_stained_glass_pane", pane(p)); break;
    case "glow": g.set(x, y, z, "glowstone"); break;
    case "door": {
      const half = y === gDoor + 1 ? "lower" : "upper";
      g.set(x, y, z, "iron_door", { facing: "west", half, hinge: "left", open: "false", powered: "false" }); break;
    }
    case "pedi": g.set(x, y, z, "smooth_quartz_stairs", { facing: "west", half: "bottom", shape: "straight", waterlogged: "false" }); break;
    case "lamp": g.set(x, y, z, "lantern", { hanging: "false", waterlogged: "false" }); break;
    default: throw new Error(`unknown kind ${kind}`);
  }
}

const out = g.save(`${DIR}/DC58518.nbt`);
console.log(`DC58518.nbt: ${out.blocks} blocks, ${out.palette} palette entries`);
