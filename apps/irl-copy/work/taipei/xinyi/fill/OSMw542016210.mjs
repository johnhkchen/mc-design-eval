import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542016210";
const W = 28, H = 23, D = 22;
const MAX_G = 9; // keep the body and roof plant inside the 23-block canvas

// Storey lines (absolute y): base course at the cell's ground, floor bands at 5 and 10,
// cornice at 11, parapet at 12. Roof deck at 11. Mechanical box on top to 14.
const BAND = [5, 10];
const inWindowBand = (y) => (y >= 1 && y <= 4) || (y >= 6 && y <= 9);

const FACES = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const k = (x, z) => `${x},${z}`;
const unk = (key) => key.split(",").map(Number);

const ground = new Map();
for (const c of cells) {
  const [x, z, gr] = c;
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(k(x, z), Math.max(0, Math.min(MAX_G, Math.round(gr))));
}
const inFp = (x, z) => ground.has(k(x, z));
const gAt = (x, z) => ground.get(k(x, z));
const faceOf = (x, z) =>
  Object.keys(FACES).filter((f) => {
    const [dx, dz] = FACES[f];
    return !inFp(x + dx, z + dz);
  });

// Footprint bounds and centre
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const key of ground.keys()) {
  const [x, z] = unk(key);
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const cx = (minX + maxX) / 2;
const cz = (minZ + maxZ) / 2;

// Entrance: prefer the south (high z) face, nearest the middle, on a storey-1 door height
let door = null;
let bestScore = Infinity;
for (const key of ground.keys()) {
  const [x, z] = unk(key);
  const f = faceOf(x, z);
  if (f.length !== 1) continue;
  const gr = gAt(x, z);
  if (gr + 2 > 4) continue;
  const score = (f[0] === "south" ? 0 : 100) + Math.abs(x - cx);
  if (score < bestScore) {
    bestScore = score;
    door = { x, z, y: gr + 1, face: f[0] };
  }
}
const doorKey = door ? k(door.x, door.z) : null;

// Warm glowstone placed on the floor just inside some upper-storey windows
const glow = new Set();
for (const key of ground.keys()) {
  const [x, z] = unk(key);
  const f = faceOf(x, z);
  if (f.length !== 1) continue;
  if (((x * 7 + z * 5) % 4) !== 0) continue;
  const [dx, dz] = FACES[f[0]];
  const ix = x - dx, iz = z - dz;
  if (!inFp(ix, iz) || faceOf(ix, iz).length > 0) continue;
  if (gAt(ix, iz) > 5) continue;
  glow.add(k(ix, iz));
}

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

for (const key of ground.keys()) {
  const [x, z] = unk(key);
  const gr = gAt(x, z);
  const faces = faceOf(x, z);
  const edge = faces.length > 0;

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (edge) {
    const corner = faces.length !== 1;
    const face = faces[0];
    const alongX = face === "north" || face === "south";
    const t = alongX ? x : z;
    const pier = corner || (((t % 3) + 3) % 3 === 0);
    const paneProps = alongX
      ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

    for (let y = gr; y <= 12; y++) {
      if (y === gr) {
        put(x, y, z, "light_gray_concrete"); // base course
      } else if (BAND.includes(y)) {
        put(x, y, z, "light_gray_concrete"); // storey line
      } else if (y === 11) {
        put(x, y, z, "smooth_stone"); // cornice
      } else if (y === 12) {
        put(x, y, z, "white_concrete"); // parapet
      } else if (inWindowBand(y) && y > gr) {
        if (doorKey === key && (y === door.y || y === door.y + 1)) {
          put(x, y, z, "iron_door", {
            facing: door.face,
            half: y === door.y ? "lower" : "upper",
            hinge: "left",
            open: "false",
            powered: "false",
          });
        } else if (pier) {
          put(x, y, z, "white_concrete");
        } else {
          put(x, y, z, "light_blue_stained_glass_pane", paneProps);
        }
      } else {
        put(x, y, z, "white_concrete");
      }
    }
  } else {
    // Interior: floor slabs only, air between, no fitted rooms
    put(x, gr, z, "smooth_stone");
    for (const by of BAND) if (by > gr) put(x, by, z, "smooth_stone");
    put(x, 11, z, "light_gray_concrete"); // roof deck
    if (glow.has(k(x, z)) && gr <= 5) put(x, 6, z, "glowstone");
  }
}

// Rooftop mechanical plant, well inside the edge, standing on the roof deck
for (const key of ground.keys()) {
  const [x, z] = unk(key);
  if (Math.abs(x - cx) > 4 || Math.abs(z - cz) > 3) continue;
  let inside = true;
  for (let i = -2; i <= 2 && inside; i++)
    for (let j = -2; j <= 2 && inside; j++)
      if (!inFp(x + i, z + j)) inside = false;
  if (!inside) continue;
  put(x, 12, z, "light_gray_concrete");
  put(x, 13, z, "light_gray_concrete");
  put(x, 14, z, "smooth_stone");
}

g.save(`${DIR}/${ID}.nbt`);
