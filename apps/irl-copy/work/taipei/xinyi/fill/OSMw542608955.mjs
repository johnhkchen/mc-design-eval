import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542608955";
const W = 22, D = 12, H = 23;

// Two-storey 1990s Xinyi commercial block: stone plinth, white concrete walls,
// pier grid of 3-block bays, tinted glazing, dark shopfront canopy, parapet, rooftop plant.
const ROOF = 10;     // roof deck (top of solid interior)
const PARAPET = 11;  // top of parapet walls
const BELT = 5;      // second-floor slab / belt course
const CANOPY = 4;    // dark canopy band over shopfront

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);

const isPerim = (x, z) =>
  [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !has(x + dx, z + dz));

function faceOf(x, z) {
  if (!has(x, z - 1)) return "front";
  if (!has(x, z + 1)) return "back";
  if (!has(x - 1, z)) return "west";
  if (!has(x + 1, z)) return "east";
  return null;
}

// inward neighbour for a facade cell
function inward(x, z, face) {
  if (face === "front") return [x, z + 1];
  if (face === "back") return [x, z - 1];
  if (face === "west") return [x + 1, z];
  return [x - 1, z];
}

const g = new Voxels([W, H, D]);

// 1. Foundations and solid interior mass, with floor slabs and roof deck.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone");
  if (!isPerim(x, z)) {
    for (let y = gr; y <= ROOF; y++) {
      const b = (y === BELT || y === ROOF) ? "light_gray_concrete" : "white_concrete";
      g.set(x, y, z, b);
    }
  }
}

// 2. Perimeter facade: plinth, walls, piers, belt course, cornice, parapet, openings.
const perimCells = cells.filter(([x, z]) => isPerim(x, z));
const openings = []; // {x, z, face, kind}

for (const [x, z, gr] of perimCells) {
  const face = faceOf(x, z);
  const along = (face === "front" || face === "back") ? x : z;
  const max = (face === "front" || face === "back") ? W - 1 : D - 1;
  const pier = along % 3 === 0 || along === max;
  const isDoor = face === "front" && along === 10;

  // plinth course
  g.set(x, gr, z, "stone_bricks");

  // wall column from plinth to parapet
  for (let y = gr + 1; y <= PARAPET; y++) {
    let b = "white_concrete";
    if (pier) b = "smooth_quartz";
    if (y === 10) b = "smooth_stone";            // cornice
    if (y === PARAPET) b = "white_concrete";     // parapet cap
    g.set(x, y, z, b);
  }

  if (pier) continue;

  // belt course at second floor level
  g.set(x, BELT, z, "light_gray_concrete");

  // dark canopy over shopfront
  if (gr < CANOPY) g.set(x, CANOPY, z, "black_concrete");

  // ground-floor shopfront glazing (or entrance door)
  if (isDoor) {
    if (gr + 2 <= 3) {
      g.set(x, gr + 1, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      g.set(x, gr + 2, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    }
    openings.push({ x, z, face, kind: "door", rows: [gr + 1, gr + 2, 3] });
  } else if (gr + 1 <= 3) {
    for (let y = gr + 1; y <= 3; y++) g.set(x, y, z, "glass");
    openings.push({ x, z, face, kind: "shop", rows: [gr + 1, 3] });
  }

  // upper-floor window: sill, glazing, head
  g.set(x, 6, z, "light_gray_concrete");
  g.set(x, 7, z, "light_blue_stained_glass");
  g.set(x, 8, z, "light_blue_stained_glass");
  g.set(x, 9, z, "light_gray_concrete");
  openings.push({ x, z, face, kind: "upper", rows: [7, 8] });
}

// 3. Air gaps behind glazing, plus warm lights in a few upper windows.
const glowAt = new Set(["4", "13", "19"]);
for (const o of openings) {
  const [ix, iz] = inward(o.x, o.z, o.face);
  if (!has(ix, iz) || isPerim(ix, iz)) continue;
  const gapRows = [];
  if (o.kind === "upper") gapRows.push(7, 8);
  if (o.kind === "shop") for (let y = o.rows[0]; y <= o.rows[1]; y++) gapRows.push(y);
  if (o.kind === "door") for (let y = o.rows[0]; y <= o.rows[2]; y++) gapRows.push(y);
  for (const y of gapRows) g.set(ix, y, iz, "air");

  if (o.kind === "upper" && o.face === "front" && glowAt.has(String(o.x))) {
    g.set(ix, 7, iz, "glowstone");
  }
}

// 4. Roof: parapet corner rod and rooftop plant on the roof deck.
g.set(0, PARAPET + 1, 0, "lightning_rod");
g.set(W - 1, PARAPET + 1, D - 1, "lightning_rod");
for (const [x, z] of [[5, 4], [6, 4], [15, 7], [16, 7]]) {
  if (!has(x, z) || isPerim(x, z)) continue;
  g.set(x, ROOF + 1, z, "light_gray_concrete");
  g.set(x, ROOF + 2, z, "light_gray_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
