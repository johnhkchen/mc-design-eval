import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC86580";
const W = 40, D = 42, H = 33;
const STOREY = 3;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p); else g.set(x, y, z, id);
};

// ---- index cells -------------------------------------------------------
const cellMap = new Map();
for (const c of raw) {
  const x = Math.round(c[0]), z = Math.round(c[1]);
  const gr = Math.min(H - 8, Math.max(0, Math.round(c[2])));
  const roof = Math.round(c[3]);
  cellMap.set(`${x},${z}`, { x, z, gr, roof });
}
const has = (x, z) => cellMap.has(`${x},${z}`);
const cells = [...cellMap.values()];

// ---- smooth roof heights over a 5x5 neighbourhood (cleaner tiers) -----
for (const c of cells) {
  let sum = 0, n = 0;
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
    const o = cellMap.get(`${c.x + dx},${c.z + dz}`);
    if (o) { sum += o.roof; n++; }
  }
  c.rs = sum / n;
}

// ---- storeys, top, perimeter, face rhythm ------------------------------
for (const c of cells) {
  let n = Math.max(1, Math.round((c.rs - c.gr) / STOREY));
  while (n > 1 && c.gr + STOREY * n + 2 > H - 1) n--;
  c.n = n;
  c.top = c.gr + STOREY * n;
  c.perim = !(has(c.x - 1, c.z) && has(c.x + 1, c.z) && has(c.x, c.z - 1) && has(c.x, c.z + 1));
  const xFace = !has(c.x - 1, c.z) || !has(c.x + 1, c.z);
  c.t = xFace ? c.z : c.x;
}
const isPerim = (x, z) => { const c = cellMap.get(`${x},${z}`); return !!(c && c.perim); };
for (const c of cells) {
  // ring = interior cells touching the facade; they stay hollow (air gap behind glass)
  c.ring = !c.perim && (isPerim(c.x - 1, c.z) || isPerim(c.x + 1, c.z) || isPerim(c.x, c.z - 1) || isPerim(c.x, c.z + 1));
}

// ---- entrance on the north edge (z minimum), near the centre ----------
const northEdge = cells.filter(c => c.perim && !has(c.x, c.z - 1));
const meanX = northEdge.reduce((s, c) => s + c.x, 0) / Math.max(1, northEdge.length);
let door = null;
for (const c of northEdge) {
  if (!door || Math.abs(c.x - meanX) < Math.abs(door.x - meanX)) door = c;
}
const doorBay = (x, z) => door && z === door.z && Math.abs(x - door.x) <= 1;

// ---- build each cell ---------------------------------------------------
for (const c of cells) {
  const { x, z, gr, top, n, perim, t } = c;

  // foundation
  for (let y = 0; y < gr; y++) put(x, y, z, perim ? "stone_bricks" : "stone");

  // solid core behind the hollow ring keeps the massing from reading as a shell
  if (!perim && !c.ring) {
    for (let y = gr; y < top; y++) put(x, y, z, "stone");
  }

  // floors and facade
  for (let k = 0; k < n; k++) {
    const f = gr + STOREY * k;
    if (perim) put(x, f, z, k === 0 ? "polished_granite" : "smooth_stone");
    else put(x, f, z, "smooth_stone");

    if (!perim) continue;

    const isDoor = door && x === door.x && z === door.z && k === 0;
    const pier = (t % 3 === 0) || (k === 0 && doorBay(x, z));

    if (isDoor) {
      put(x, f + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, f + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (pier) {
      put(x, f + 1, z, "polished_andesite");
      put(x, f + 2, z, "polished_andesite");
      // tall entrance piers carry up past the door lintel
      if (k === 0 && doorBay(x, z) && x !== door.x) put(x, f + 3, z, "calcite");
      continue;
    }
    if (k === 0) {
      // ground floor lobby glass; a single warm lamp at the door side
      const warm = Math.abs(x - door.x) === 2 && z === door.z;
      put(x, f + 1, z, warm ? "glowstone" : "gray_stained_glass_pane");
      put(x, f + 2, z, "gray_stained_glass_pane");
    } else {
      // sparse lit offices, not a spotted pattern
      const lit = (t * 3 + k * 5) % 19 === 7;
      put(x, f + 1, z, lit ? "glowstone" : "gray_stained_glass_pane");
      put(x, f + 2, z, "gray_stained_glass_pane");
    }
  }

  // roof
  if (perim) {
    put(x, top, z, "polished_granite");           // cornice
    if (top + 1 < H) put(x, top + 1, z, "calcite"); // parapet
  } else {
    put(x, top, z, "smooth_stone");               // roof deck
  }
}

// ---- entrance canopy: a flat lintel course over the door bay, one storey up,
//      carried on the calcite piers, so the door reads from the street ----
if (door) {
  for (const dx of [-1, 0, 1]) {
    const c = cellMap.get(`${door.x + dx},${door.z}`);
    if (c && c.perim) put(c.x, c.gr + 3, c.z, "polished_granite");
  }
}

g.save(`${DIR}/${ID}.nbt`);
