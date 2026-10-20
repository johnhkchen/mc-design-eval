import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3329408";
const W = 34, H = 31, D = 22;

// ---- footprint + lidar massing ------------------------------------------
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cells = new Map();
for (const [x, z, g, r] of raw) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const gg = Math.round(g);
  const rr = Math.min(Math.max(Math.round(r), gg + 5), H - 4);
  cells.set(`${x},${z}`, { x, z, g: gg, r: rr });
}

// ---- block store (later writes win) --------------------------------------
const blocks = new Map();
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  blocks.set(`${x},${y},${z}`, { x, y, z, id, props });
};

// ---- helpers --------------------------------------------------------------
const FACES = {
  east: [1, 0], west: [-1, 0], south: [0, 1], north: [0, -1],
};

function exposedFaces(c) {
  const out = [];
  for (const [name, [dx, dz]] of Object.entries(FACES)) {
    const n = cells.get(`${c.x + dx},${c.z + dz}`);
    if (!n || n.r < c.r - 1) out.push(name);
  }
  return out;
}

function floorsOf(c) {
  const f = [c.g];
  for (let y = c.g + 4; y <= c.r - 3; y += 3) f.push(y);
  return f;
}

function paneProps(face) {
  const ew = face === "east" || face === "west";
  return ew
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
}

function bayIndex(c, face) {
  return face === "east" || face === "west" ? c.z : c.x;
}

// ---- entrance: exposed ground-level bay nearest the middle -----------------
let door = null;
{
  let best = Infinity;
  for (const c of cells.values()) {
    const ex = exposedFaces(c);
    if (!ex.length) continue;
    for (const f of ex) {
      if (bayIndex(c, f) % 3 === 0) continue;
      const score = Math.abs(c.x - W / 2) + Math.abs(c.z - D / 2);
      if (score < best) {
        best = score;
        door = { x: c.x, z: c.z, face: f, idx: bayIndex(c, f) };
      }
    }
  }
}

// is this shell cell a stone flank beside the door (same wall line, adjacent bay)?
function isDoorFlank(c, face) {
  if (!door || face !== door.face) return false;
  const sameLine = (face === "east" || face === "west") ? c.x === door.x : c.z === door.z;
  if (!sameLine) return false;
  return Math.abs(bayIndex(c, face) - door.idx) === 1;
}

// ---- build the massing ----------------------------------------------------
const shellCells = [];
for (const c of cells.values()) {
  const ex = exposedFaces(c);
  const shell = ex.length > 0;
  const floors = floorsOf(c);

  // foundation up to its ground
  for (let y = 0; y < c.g; y++) put(c.x, y, c.z, "stone_bricks");

  for (let y = c.g; y < c.r - 1; y++) {
    const isFloor = floors.includes(y);

    if (!shell) {
      if (isFloor) put(c.x, y, c.z, "smooth_stone");
      continue;
    }

    // string courses and the ground-level plinth read as stone bands
    if (isFloor) {
      put(c.x, y, c.z, "stone_bricks");
      continue;
    }

    const face = ex[0];
    const pier = bayIndex(c, face) % 3 === 0;
    const ground = y <= c.g + 3;

    // door and its transom
    if (door && door.x === c.x && door.z === c.z && face === door.face && ground) {
      if (y === c.g + 1 || y === c.g + 2) {
        put(c.x, y, c.z, "dark_oak_door", {
          facing: face,
          half: y === c.g + 1 ? "lower" : "upper",
          hinge: "left", open: "false", powered: "false",
        });
        continue;
      }
      put(c.x, y, c.z, "stone_bricks"); // transom lintel over the door
      continue;
    }

    // stone surround on the flanks of the door
    if (ground && isDoorFlank(c, face)) {
      put(c.x, y, c.z, "stone_bricks");
      continue;
    }

    if (pier) {
      put(c.x, y, c.z, ground ? "stone_bricks" : "bricks");
    } else {
      put(c.x, y, c.z, "glass_pane", paneProps(face));
    }
  }

  // cornice band: a stone course with the brick parapet beneath it
  if (shell) {
    const face = ex[0];
    const pierTop = bayIndex(c, face) % 3 === 0;
    put(c.x, c.r - 2, c.z, pierTop ? "stone_bricks" : "bricks");
    put(c.x, c.r - 1, c.z, "stone_bricks");
    shellCells.push({ c, ex, floors });
  } else {
    put(c.x, c.r - 1, c.z, "stone");
  }
}

// ---- sparse warm lights behind some glass (in the air gap) ----------------
for (const { c, ex, floors } of shellCells) {
  for (const face of ex) {
    if (bayIndex(c, face) % 3 === 0) continue;
    const [dx, dz] = FACES[face];
    const inner = cells.get(`${c.x - dx},${c.z - dz}`);
    if (!inner || exposedFaces(inner).length) continue;
    for (let y = c.g + 1; y < c.r - 2; y++) {
      if (floors.includes(y)) continue;
      if (y <= c.g + 3) continue; // keep the shopfront dark
      if (((c.x * 5 + c.z * 3 + y) % 13) !== 0) continue;
      if (inner.r - 1 <= y) continue;
      put(inner.x, y, inner.z, "glowstone");
    }
  }
}

// ---- roof: a few brick flues on interior roof decks -----------------------
for (const c of cells.values()) {
  if (exposedFaces(c).length) continue;
  if (((c.x * 7 + c.z * 5) % 19) !== 0) continue;
  if (c.r + 3 >= H) continue;
  put(c.x, c.r, c.z, "bricks");
  put(c.x, c.r + 1, c.z, "bricks");
  put(c.x, c.r + 2, c.z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// ---- write -----------------------------------------------------------------
const g = new Voxels([W, H, D]);
for (const b of blocks.values()) {
  if (b.props) g.set(b.x, b.y, b.z, b.id, b.props);
  else g.set(b.x, b.y, b.z, b.id);
}
g.save(`${DIR}/${ID}.nbt`);
