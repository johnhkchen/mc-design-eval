import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833630";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 16 x 20 footprint, roof about 11 blocks above lowest ground.
// Reads as a two-storey mid-century Taipei shophouse: concrete frame with
// quartz string courses, a shopfront at street level, upper windows, a
// parapet and a rooftop water tank.
const W = 16, H = 23, D = 20;
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const key = (x, z) => x + "," + z;
const inside = new Set();
const gm = new Map();
for (const [x, z, gr] of cells) {
  inside.add(key(x, z));
  gm.set(key(x, z), Math.max(0, Math.min(10, Math.round(gr))));
}

const minX = Math.min(...cells.map((c) => c[0]));
const maxX = Math.max(...cells.map((c) => c[0]));
const minZ = Math.min(...cells.map((c) => c[1]));
const maxZ = Math.max(...cells.map((c) => c[1]));

const FACES = [
  { n: "north", dx: 0, dz: -1, axis: "x" },
  { n: "south", dx: 0, dz: 1, axis: "x" },
  { n: "east", dx: 1, dz: 0, axis: "z" },
  { n: "west", dx: -1, dz: 0, axis: "z" },
];
const exteriorFaces = (x, z) => FACES.filter((f) => !inside.has(key(x + f.dx, z + f.dz)));
const alongOf = (f, x, z) => (f.axis === "x" ? x - minX : z - minZ);
const spanOf = (f) => (f.axis === "x" ? maxX - minX + 1 : maxZ - minZ + 1);

// Pane connection state so glass joins its frame visually.
const paneProps = (f) =>
  f.axis === "x"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Choose the street-facing door: the exterior face direction with most cells,
// door at its middle cell.
const byFace = {};
for (const [x, z] of cells) {
  for (const f of exteriorFaces(x, z)) (byFace[f.n] ??= []).push({ x, z, f });
}
let doorFace = null;
for (const f of FACES) {
  const list = byFace[f.n] ?? [];
  if (!list.length) continue;
  if (!doorFace || list.length > (byFace[doorFace.n]?.length ?? 0)) doorFace = f;
}
const doorList = (byFace[doorFace.n] ?? []).slice().sort(
  (a, b) => alongOf(doorFace, a.x, a.z) - alongOf(doorFace, b.x, b.z)
);
const doorCell = doorList[Math.floor(doorList.length / 2)];
const doorKey = key(doorCell.x, doorCell.z);
const doorAlong = alongOf(doorFace, doorCell.x, doorCell.z);

// Interior air for the whole footprint, foundation below each cell's ground.
for (const [x, z] of cells) {
  const gr = gm.get(key(x, z));
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const ext = exteriorFaces(x, z);

  // Interior cell: floor slab per storey and roof slab, air between.
  if (ext.length === 0) {
    if (5 >= gr) put(x, 5, z, "smooth_stone");
    put(x, 11, z, "light_gray_concrete");
    continue;
  }

  const isDoor = key(x, z) === doorKey && ext.some((e) => e.n === doorFace.n);
  const primary = ext[0];
  const face = isDoor ? doorFace : primary;
  const i = alongOf(face, x, z);
  const L = spanOf(face);
  const pier = !isDoor && (i === 0 || i === L - 1 || i % 3 === 0);
  const awn =
    !pier &&
    ext.some((e) => e.n === doorFace.n) &&
    Math.abs(alongOf(doorFace, x, z) - doorAlong) <= 1;

  const inX = x - face.dx;
  const inZ = z - face.dz;
  const interiorBehind = inside.has(key(inX, inZ));

  const C = ["white_concrete"];
  const pane = (kind) => [kind, paneProps(face)];

  for (let y = gr; y <= 12; y++) {
    let spec = null;

    if (isDoor && (y === gr || y === gr + 1) && y <= 3) {
      spec = [
        "dark_oak_door",
        {
          facing: face.n,
          half: y === gr ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        },
      ];
    } else if (y <= 4) {
      if (y === gr) {
        spec = pier ? C : ["polished_andesite"];
      } else if (y <= 3) {
        spec = pier ? C : pane("glass_pane");
        // Warm glowstone behind shop glass.
        if (!pier && !isDoor && i % 3 === 2 && interiorBehind) {
          put(inX, 2, inZ, "glowstone");
        }
      } else {
        // y === 4 lintel / awning
        if (pier) spec = C;
        else if (awn) spec = ["red_concrete_slab", { type: "bottom", waterlogged: "false" }];
        else spec = ["smooth_quartz"];
      }
    } else if (y === 5) {
      spec = pier ? C : ["smooth_quartz"];
    } else if (y <= 9) {
      spec = pier ? C : pane("light_blue_stained_glass_pane");
      // Shroomlight behind selected upper windows.
      if (y === 7 && !pier && i % 4 === 1 && interiorBehind) {
        put(inX, 7, inZ, "shroomlight");
      }
    } else if (y === 10) {
      spec = pier ? C : ["smooth_quartz"];
    } else {
      // parapet 11..12
      spec = C;
    }

    if (spec) {
      if (spec[1]) put(x, y, z, spec[0], spec[1]);
      else put(x, y, z, spec[0]);
    }
  }

  // Interior floor at storey line 5 is a slab over the air storey; the
  // exterior band already covers it, so nothing extra is needed here.
}

// Rooftop water tank on a 2x2 block of the roof centre.
const cx = Math.floor((minX + maxX) / 2);
const cz = Math.floor((minZ + maxZ) / 2);
for (const dx of [0, 1]) {
  for (const dz of [0, 1]) {
    const x = cx + dx;
    const z = cz + dz;
    if (!inside.has(key(x, z))) continue;
    for (let y = 12; y <= 13; y++) put(x, y, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
