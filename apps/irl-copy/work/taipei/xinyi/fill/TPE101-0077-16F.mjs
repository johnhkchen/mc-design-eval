import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// TPE101-0077-16F: 2012 Xinyi office/residential tower, 48 x 36 footprint.
// Glazed mid-rise block: stone-clad lobby with a marked entrance, white
// concrete spandrel bands every 5 blocks with white frames, a cornice and
// parapet, and a mechanical penthouse with a mast. Storey lines are global;
// each footprint column is solid foundation from y 0 up to its own ground,
// so the roof stays flat at y 78.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE101-0077-16F";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 48, H = 90, D = 36;
const ROOF = 78;
const LOBBY_H = 6;
const STOREY_H = 5;

const g = new Voxels([W, H, D]);

const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);

const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Glass with white frames every 3 cells along the face; a few warm lit
// windows (shroomlight) on upper floors only.
function winBlock(idx, x, z, s, rel) {
  if (idx % 3 === 0) return "white_concrete";
  if (s > 0 && rel === 2 && (x * 5 + z * 3 + s * 7) % 29 === 0) return "shroomlight";
  return "cyan_stained_glass_pane";
}

// ---- entrance: south face, nearest the middle, non-corner cell ----
let door = null;
{
  let sumX = 0, n = 0;
  for (const [x] of cells) { sumX += x; n++; }
  const cx = sumX / n;
  for (const [x, z, gr] of cells) {
    if (!has(x, z + 1) && has(x - 1, z) && has(x + 1, z)) {
      const d = Math.abs(x - cx);
      if (!door || d < door.d) door = { x, z, gr, d };
    }
  }
}

// ---- main body ----
for (const [x, z, gr] of cells) {
  const edge = isEdge(x, z);
  const faceX = !has(x, z - 1) || !has(x, z + 1);
  const idx = faceX ? x : z;

  for (let y = 0; y < ROOF; y++) {
    if (y < gr) {
      g.set(x, y, z, "stone_bricks");
      continue;
    }

    let b = null;

    if (y >= 76) {
      // cornice band, then parapet
      if (edge) b = (y === 76) ? "smooth_stone" : "white_concrete";
      else if (y === 77) b = "light_gray_concrete";
    } else if (y < LOBBY_H) {
      // stone-clad lobby base with a dark glazed shopfront
      if (y === 0) b = edge ? "stone_bricks" : "smooth_stone";
      else if (y === 5) b = edge ? "smooth_stone" : null;
      else if (edge) {
        // dark shopfront glass with white frames
        b = (idx % 3 === 0) ? "white_concrete" : "gray_stained_glass_pane";
      }
    } else {
      const s = Math.floor((y - LOBBY_H) / STOREY_H) + 1;
      const rel = (y - LOBBY_H) % STOREY_H;
      if (rel === 0) b = "white_concrete";
      else if (edge) {
        if (rel === 4) b = "light_gray_concrete";
        else b = winBlock(idx, x, z, s, rel);
      }
    }

    if (b) g.set(x, y, z, b);
  }
}

// ---- entrance detail ----
if (door) {
  const { x, z, gr } = door;
  // stone piers and lintel framing the door
  for (const dx of [-1, 1]) {
    if (has(x + dx, z)) {
      for (let y = gr; y <= gr + 3; y++) g.set(x + dx, y, z, "smooth_stone");
    }
  }
  g.set(x, gr + 2, z, "smooth_stone");
  g.set(x, gr + 3, z, "smooth_stone");
  // the door itself
  g.set(x, gr, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, gr + 1, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  // warm lanterns standing on the piers either side of the door
  for (const dx of [-1, 1]) {
    if (has(x + dx, z)) {
      g.set(x + dx, gr + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }
}

// ---- mechanical penthouse ----
const PH = (x, z) => has(x, z) && Math.abs(x - 24) <= 7 && Math.abs(z - 18) <= 6;
const phEdge = (x, z) => !PH(x - 1, z) || !PH(x + 1, z) || !PH(x, z - 1) || !PH(x, z + 1);
let phCore = null;
for (const [x, z] of cells) {
  if (!PH(x, z)) continue;
  const edge = phEdge(x, z);
  const faceX = !PH(x, z - 1) || !PH(x, z + 1);
  const idx = faceX ? x : z;
  if (edge) {
    for (let y = 78; y <= 80; y++) {
      if (y === 79) g.set(x, y, z, winBlock(idx, x, z, 0, 1));
      else g.set(x, y, z, "light_gray_concrete");
    }
  }
  g.set(x, 81, z, "white_concrete");
  const d = Math.abs(x - 24) + Math.abs(z - 18);
  if (!phCore || d < phCore.d) phCore = { x, z, d };
}

// ---- antenna mast ----
if (phCore) {
  for (let y = 82; y <= 85; y++) {
    g.set(phCore.x, y, phCore.z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
