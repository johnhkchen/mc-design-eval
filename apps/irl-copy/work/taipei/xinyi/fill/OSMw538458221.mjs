import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538458221";
const W = 8, H = 23, D = 25;
const TOP = 11;        // parapet course (roof about 11 blocks above lowest ground)
const FLOOR1 = 5;      // first floor slab, storey 1 ~5 blocks
const ROOF = 10;       // roof deck / cornice course

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, Math.max(0, Math.min(ROOF, Math.round(gr))));
}
const inFoot = (x, z) => ground.has(`${x},${z}`);
const groundOf = (x, z) => ground.get(`${x},${z}`);

const GLASS_NS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const GLASS_EW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

// Pass 1: foundations, interior floor slabs and roof deck on every footprint cell
for (const [x, z, gr0] of cells) {
  const gr = groundOf(x, z);
  if (gr === undefined) continue;
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  if (FLOOR1 >= gr) put(x, FLOOR1, z, "smooth_quartz");
  if (ROOF >= gr) put(x, ROOF, z, "smooth_quartz");
}

// Facade classification
const isWindowT = (t) => t >= 1 && t <= (t === undefined ? 0 : 0) + 0 || false;

function faceInfo(x, z) {
  const onX = x === 0 || x === W - 1;
  const onZ = z === 0 || z === D - 1;
  if (onX && onZ) return { kind: "corner" };
  if (x === 0) return { kind: "face", face: "west", t: z, len: D, ns: false };
  if (x === W - 1) return { kind: "face", face: "east", t: z, len: D, ns: false };
  if (z === 0) return { kind: "face", face: "north", t: x, len: W, ns: true };
  if (z === D - 1) return { kind: "face", face: "south", t: x, len: W, ns: true };
  return { kind: "interior" };
}

const isPier = (t, len) => t === 0 || t === len - 1 || t % 3 === 0;

// Pass 2: perimeter walls, windows, doors, parapet
for (const [x, z] of [...ground.keys()].map((k) => k.split(",").map(Number))) {
  const gr = groundOf(x, z);
  const info = faceInfo(x, z);
  if (info.kind === "interior") continue;

  for (let y = gr; y <= TOP; y++) {
    if (info.kind === "corner") {
      if (y === TOP) put(x, y, z, "quartz_slab", { type: "bottom", waterlogged: "false" });
      else if (y === gr) put(x, y, z, "stone_bricks");
      else put(x, y, z, "quartz_block");
      continue;
    }

    const { face, t, len, ns } = info;
    const windowCol = !isPier(t, len);

    // Parapet
    if (y === TOP) {
      put(x, y, z, "quartz_slab", { type: "bottom", waterlogged: "false" });
      continue;
    }
    // Base course
    if (y === gr) {
      put(x, y, z, "stone_bricks");
      continue;
    }

    // Entrance on west face, z = 13
    if (face === "west" && t === 13) {
      if (y === gr + 1) { put(x, y, z, "dark_oak_door", { facing: "east", half: "lower", hinge: "left", open: "false", powered: "false" }); continue; }
      if (y === gr + 2) { put(x, y, z, "dark_oak_door", { facing: "east", half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
      if (y === gr + 3) { put(x, y, z, "glass_pane", ns ? GLASS_NS : GLASS_EW); continue; }
    }

    if (windowCol) {
      const props = ns ? GLASS_EW : GLASS_NS;
      // Ground-floor shopfront
      if (y >= gr + 1 && y <= 3) { put(x, y, z, "glass_pane", props); continue; }
      if (y === 4) { put(x, y, z, "light_gray_concrete"); continue; }
      // Upper-floor windows
      if (y === 7 || y === 8) { put(x, y, z, "glass_pane", props); continue; }
      if (y === 6 || y === 9) { put(x, y, z, "light_gray_concrete"); continue; }
    }

    // Solid wall / spandrel / cornice
    if (y === ROOF) put(x, y, z, "smooth_quartz");
    else if (y === FLOOR1) put(x, y, z, "smooth_quartz");
    else put(x, y, z, "quartz_block");
  }
}

// Pass 3: warm lights behind selected windows (air gap inside)
for (const [x, z] of [...ground.keys()].map((k) => k.split(",").map(Number))) {
  const gr = groundOf(x, z);
  const info = faceInfo(x, z);
  if (info.kind !== "face") continue;
  const { face, t, len } = info;
  if (isPier(t, len)) continue;
  if (face === "west" && t === 13) continue;
  const lit = t % 6 === 2;
  const litGround = t % 6 === 4;
  let ix, iz;
  if (face === "west") { ix = 1; iz = z; }
  else if (face === "east") { ix = W - 2; iz = z; }
  else if (face === "north") { ix = x; iz = 1; }
  else { ix = x; iz = D - 2; }
  if (lit) put(ix, 7, iz, "glowstone");
  if (litGround && gr + 1 <= 3) put(ix, gr + 1, iz, "glowstone");
}

// Pass 4: roof equipment on interior cells above the deck
for (let x = 2; x <= 3; x++)
  for (let z = 16; z <= 17; z++)
    if (inFoot(x, z)) for (let y = TOP; y <= TOP + 1; y++) put(x, y, z, "light_gray_concrete");

for (let x = 5; x <= 6; x++)
  for (let z = 20; z <= 21; z++)
    if (inFoot(x, z)) put(x, TOP, z, "iron_block");

if (inFoot(4, 4)) put(4, TOP, 4, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

g.save(`${DIR}/${ID}.nbt`);
