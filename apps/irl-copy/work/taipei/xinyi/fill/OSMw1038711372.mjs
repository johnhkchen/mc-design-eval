import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1038711372";
const W = 33, H = 23, D = 44;

// ---- footprint ----------------------------------------------------------
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const minG = Math.min(...raw.map((c) => c[2]));
const ground = new Map();
for (const [x, z, gnd] of raw) ground.set(`${x},${z}`, Math.round(gnd - minG));

const inFP = (x, z) => ground.has(`${x},${z}`);
const NB = [
  [1, 0, "east"],
  [-1, 0, "west"],
  [0, 1, "south"],
  [0, -1, "north"],
];
const outs = (x, z) => NB.filter(([dx, dz]) => !inFP(x + dx, z + dz));
const isPerim = (x, z) => outs(x, z).length > 0;

// ---- helpers --------------------------------------------------------------
const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Levels (absolute y): ground storey gc..4, belt 5, upper storey 6..8,
// sill/lintel 9, cornice 10, parapet 11. Roof deck at 10 inside.
const BELT = 5, CORNICE = 10, PARAPET = 11;

// ---- pick the front (largest single-facing street side) and its door ---
const faceCount = { east: [], west: [], south: [], north: [] };
for (const [key] of ground) {
  const [x, z] = key.split(",").map(Number);
  const o = outs(x, z);
  if (o.length === 1) faceCount[o[0][2]].push(o[0][0] !== 0 ? z : x);
}
let frontFace = null;
for (const f of Object.keys(faceCount)) {
  if (!frontFace || faceCount[f].length > faceCount[frontFace].length) frontFace = f;
}
let door = null;
if (frontFace && faceCount[frontFace].length) {
  const us = faceCount[frontFace].slice().sort((a, b) => a - b);
  const du = us[Math.floor(us.length / 2)];
  for (const [key] of ground) {
    const [x, z] = key.split(",").map(Number);
    const o = outs(x, z);
    if (o.length === 1 && o[0][2] === frontFace && (o[0][0] !== 0 ? z : x) === du) {
      door = { x, z, face: frontFace };
      break;
    }
  }
}

// ---- build ------------------------------------------------------------------
for (const [key, gc] of ground) {
  const [x, z] = key.split(",").map(Number);

  // foundation: solid from y0 up to this cell's ground
  for (let y = 0; y < gc; y++) put(x, y, z, "stone");

  const perim = isPerim(x, z);

  if (!perim) {
    // interior: storey slab at belt level, roof deck
    if (gc <= BELT) put(x, BELT, z, "light_gray_concrete");
    if (gc <= CORNICE) put(x, CORNICE, z, "light_gray_concrete");

    // rooftop AC boxes and a few service units
    if (gc <= CORNICE && x % 5 === 2 && z % 7 === 3) {
      put(x, 11, z, "light_gray_concrete");
      put(x, 12, z, "light_gray_concrete");
    }
    continue;
  }

  // ---- perimeter facade ----
  const o = outs(x, z);
  const single = o.length === 1;
  const [dx, dz, face] = o[0];
  const u = dx !== 0 ? z : x;
  const pier = !single || u % 4 === 0;
  const isDoor = door && door.x === x && door.z === z;

  const paneProps =
    dx !== 0
      ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
      : { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };

  for (let y = gc; y <= PARAPET; y++) {
    if (y === PARAPET) {
      put(x, y, z, "stone_brick_wall");
    } else if (y === CORNICE) {
      put(x, y, z, "smooth_stone");
    } else if (y === 9) {
      put(x, y, z, "white_concrete");
    } else if (y >= 6) {
      if (pier) put(x, y, z, "white_concrete");
      else put(x, y, z, "glass_pane", paneProps);
    } else if (y === BELT) {
      put(x, y, z, "smooth_stone");
    } else {
      // ground storey, y in [gc, 4]
      if (y === gc) put(x, y, z, "stone_bricks");
      else if (y === 4) put(x, y, z, pier ? "white_concrete" : "smooth_stone");
      else if (pier) put(x, y, z, "white_concrete");
      else put(x, y, z, "glass_pane", paneProps);
    }
  }

  // entrance on the front street face
  if (isDoor) {
    const dy = gc + 1;
    if (dy + 1 <= 4) {
      const doorProps = (half) => ({
        facing: face,
        half,
        hinge: "left",
        open: "false",
        powered: "false",
      });
      put(x, dy, z, "oak_door", doorProps("lower"));
      put(x, dy + 1, z, "oak_door", doorProps("upper"));
    }
    // warm entrance lantern hanging from the belt course
    put(x, 4, z, "lantern", { hanging: "true", waterlogged: "false" });
  }

  // warm light behind glass: shopfront glowstone, upper shroomlight
  const ix = x - dx, iz = z - dz;
  if (!pier && !isDoor && inFP(ix, iz) && !isPerim(ix, iz)) {
    if (gc + 2 <= 3 && u % 12 === 6) put(ix, gc + 2, iz, "glowstone");
    if (u % 8 === 6) put(ix, 7, iz, "shroomlight");
  }
}

g.save(`${DIR}/${ID}.nbt`);
