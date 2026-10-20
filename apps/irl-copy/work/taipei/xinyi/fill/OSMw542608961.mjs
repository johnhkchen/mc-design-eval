import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542608961";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 34, H = 23, D = 21;
const g = new Voxels([W, H, D]);

// footprint lookup: "x,z" -> ground (third number)
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const inSet = (x, z) => ground.has(`${x},${z}`);

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// exposed faces of a footprint cell (perimeter = has a missing neighbour)
const faces = (x, z) => {
  const f = [];
  if (!inSet(x, z - 1)) f.push("N");
  if (!inSet(x, z + 1)) f.push("S");
  if (!inSet(x - 1, z)) f.push("W");
  if (!inSet(x + 1, z)) f.push("E");
  return f;
};

// tangent index along a face: piers every third block
const tIndex = (f, x, z) => (f === "N" || f === "S" ? x : z);
const isPier = (f, x, z) => tIndex(f, x, z) % 3 === 0;

// interior neighbour behind a face
const behind = (f, x, z) => {
  switch (f) {
    case "N": return [x, z + 1];
    case "S": return [x, z - 1];
    case "W": return [x + 1, z];
    case "E": return [x - 1, z];
  }
};

// door: centre of the south (front) facade
const southXs = cells.filter(([x, z]) => !inSet(x, z + 1)).map(([x]) => x);
const doorX = southXs.length
  ? Math.round(southXs.reduce((a, b) => a + b, 0) / southXs.length)
  : -1;

const paneProps = (f) =>
  f === "N" || f === "S"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// ---- pass 1: foundations, floors, roof deck, cornice, parapet ----
for (const [x, z, gr] of cells) {
  const fl = faces(x, z);
  const perim = fl.length > 0;

  // foundation below ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // ground floor slab
  put(x, gr, z, perim ? "stone_bricks" : "smooth_stone");

  // storey line and roof deck
  put(x, gr + 5, z, perim ? "smooth_quartz" : "smooth_stone");
  put(x, gr + 10, z, perim ? "smooth_quartz" : "smooth_stone");

  // parapet on perimeter
  if (perim) put(x, gr + 11, z, "quartz_slab", { type: "bottom", waterlogged: "false" });
}

// ---- pass 2: walls, windows, shopfronts, door, lights ----
for (const [x, z, gr] of cells) {
  const fl = faces(x, z);
  if (fl.length === 0) continue;

  // walls on storeys 1 and 2 (ground+1 .. ground+9)
  for (let y = gr + 1; y <= gr + 9; y++) {
    if (y === gr + 4) { put(x, y, z, "stone_bricks"); continue; } // lintel / ground-floor cornice
    if (y === gr + 5) continue; // storey band already set
    put(x, y, z, "white_concrete");
  }

  // windows and door, per exposed face
  let doorHere = false;
  for (const f of fl) {
    if (f === "S" && x === doorX) doorHere = true;
  }

  const windowFace = fl.find((f) => !isPier(f, x, z));
  const rows = [];
  if (windowFace) {
    rows.push(gr + 1, gr + 2, gr + 3); // shopfront
    rows.push(gr + 6, gr + 7, gr + 8); // upper glazing
  }

  for (const y of rows) {
    const isGround = y <= gr + 3;
    if (isGround && doorHere && (y === gr + 1 || y === gr + 2)) {
      const half = y === gr + 1 ? "lower" : "upper";
      put(x, y, z, "oak_door", {
        facing: "south", half, hinge: "left", open: "false", powered: "false",
      });
      continue;
    }
    put(x, y, z, "light_blue_stained_glass_pane", paneProps(windowFace));
  }

  // warm lights behind some glazing
  if (windowFace && (x * 7 + z * 3) % 5 === 0) {
    const [ix, iz] = behind(windowFace, x, z);
    if (inSet(ix, iz)) {
      put(ix, gr + 2, iz, "shroomlight");
    }
  }
  if (windowFace && (x * 5 + z * 11) % 7 === 0) {
    const [ix, iz] = behind(windowFace, x, z);
    if (inSet(ix, iz)) {
      put(ix, gr + 7, iz, "shroomlight");
    }
  }

  // entrance canopy-level lintel over door
  if (doorHere) {
    put(x, gr + 4, z, "stone_bricks");
  }
}

// ---- pass 3: roof equipment on interior roof ----
for (const [x, z, gr] of cells) {
  const perim = faces(x, z).length > 0;
  if (perim) continue;
  if (x % 6 === 3 && z % 5 === 2) {
    put(x, gr + 11, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
