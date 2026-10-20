import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3329410";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 22, H = 37, D = 11;
const g = new Voxels([W, H, D]);

// ---- footprint lookup -------------------------------------------------
const cellMap = new Map();
for (const [x, z, gr, roof] of cells) {
  cellMap.set(`${x},${z}`, { x, z, g: Math.round(gr), roof });
}
const has = (x, z) => cellMap.has(`${x},${z}`);
const isPerim = (x, z) =>
  !(has(x + 1, z) && has(x - 1, z) && has(x, z + 1) && has(x, z - 1));
const zFace = (x, z) => !has(x, z - 1) || !has(x, z + 1);

// inward direction from a perimeter cell (toward the footprint interior)
function inward(x, z) {
  if (!has(x + 1, z)) return [x - 1, z];
  if (!has(x - 1, z)) return [x + 1, z];
  if (!has(x, z + 1)) return [x, z - 1];
  if (!has(x, z - 1)) return [x, z + 1];
  return null;
}

// ---- storey-quantised tops (4 blocks per storey) ----------------------
const STOREY = 4;
const MAX_TOP = H - 2; // leave room for parapet (top, top+1)
for (const c of cellMap.values()) {
  const rel = Math.round((c.roof - c.g) / STOREY);
  const maxN = Math.floor((MAX_TOP - c.g) / STOREY);
  const n = Math.max(1, Math.min(rel, maxN));
  c.top = c.g + STOREY * n;
  c.perim = isPerim(c.x, c.z);
}

// ---- entrance: street-side edge (lowest z), near the middle ------------
let doorCell = null;
{
  const minZ = Math.min(...[...cellMap.values()].map((c) => c.z));
  const cand = [...cellMap.values()]
    .filter((c) => c.z === minZ && c.perim)
    .sort((a, b) => Math.abs(a.x - 11) - Math.abs(b.x - 11));
  if (cand.length) doorCell = cand[0];
}
const isDoorSurround = (x, z, k) =>
  doorCell && k === 0 && z === doorCell.z && Math.abs(x - doorCell.x) <= 1;

// ---- main build -------------------------------------------------------
for (const c of cellMap.values()) {
  const { x, z, g: gr, top } = c;

  // foundation up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  if (!c.perim) {
    // interior: floor slab at every storey line, roof slab at top
    for (let y = gr; y <= top; y += STOREY) g.set(x, y, z, "smooth_stone");
    continue;
  }

  const zf = zFace(x, z);
  const paneProps = zf
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

  // walls: storey bands
  for (let y = gr; y < top; y++) {
    const k = Math.floor((y - gr) / STOREY);
    const b = gr + k * STOREY;
    const r = y - b;

    if (r === 0) {
      // storey line: stone base course at grade, brick above
      g.set(x, y, z, k === 0 ? "polished_granite" : "stone_bricks");
    } else if (r === 3) {
      g.set(x, y, z, "bricks"); // lintel course, same brick as the wall
    } else {
      // window band (r = 1, 2)
      if (isDoorSurround(x, z, k)) {
        if (x === doorCell.x) {
          // door opening, filled in below
          g.set(x, y, z, "air");
        } else {
          g.set(x, y, z, "stone_bricks"); // door surround piers
        }
      } else if ((x + z) % 3 === 0) {
        g.set(x, y, z, "bricks"); // brick pier
      } else {
        g.set(x, y, z, "glass_pane", paneProps);
        // warm light behind some panes (first band only)
        if (r === 1 && (x * 5 + z * 3 + k * 2) % 4 === 0) {
          const inn = inward(x, z);
          if (inn && has(inn[0], inn[1]) && !isPerim(inn[0], inn[1])) {
            const ic = cellMap.get(`${inn[0]},${inn[1]}`);
            if (ic.g === gr) g.set(inn[0], b + 1, inn[1], "glowstone");
          }
        }
      }
    }
  }

  // parapet / cornice
  g.set(x, top, z, "stone_bricks");
  g.set(x, top + 1, z, "stone_bricks");
}

// ---- entrance door on ground storey -----------------------------------
if (doorCell) {
  const { x, z, g: gr } = doorCell;
  g.set(x, gr + 1, z, "oak_door", {
    facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  g.set(x, gr + 2, z, "oak_door", {
    facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
  });
  // stone lintel over the door opening, already at gr+3 via the r===3 course
  // re-set it in stone so the entrance reads as a distinct surround
  for (const dx of [-1, 0, 1]) {
    if (has(x + dx, z)) g.set(x + dx, gr + 3, z, "stone_bricks");
  }
}

// ---- roof plant: a small wooden water tank on a 2x2 interior footprint --
{
  let maxTop = -1;
  for (const c of cellMap.values()) if (!c.perim) maxTop = Math.max(maxTop, c.top);
  let placed = false;
  const interior = [...cellMap.values()]
    .filter((c) => !c.perim && c.top === maxTop)
    .sort((a, b) => Math.hypot(a.x - 11, a.z - 5) - Math.hypot(b.x - 11, b.z - 5));
  for (const c of interior) {
    if (placed) break;
    const pts = [[c.x, c.z], [c.x + 1, c.z], [c.x, c.z + 1], [c.x + 1, c.z + 1]];
    const ok = pts.every(([px, pz]) => {
      const q = cellMap.get(`${px},${pz}`);
      return q && !q.perim && q.top === maxTop;
    });
    if (!ok || maxTop + 3 >= H) continue;
    for (const [px, pz] of pts) {
      g.set(px, maxTop + 1, pz, "iron_bars");
      g.set(px, maxTop + 2, pz, "oak_planks");
    }
    g.set(c.x, maxTop + 3, c.z, "oak_slab", { type: "top", waterlogged: "false" });
    placed = true;
  }
}

g.save(`${DIR}/${ID}.nbt`);
