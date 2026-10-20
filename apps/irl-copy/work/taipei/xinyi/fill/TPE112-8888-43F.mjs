import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE112-8888-43F";
const W = 102, H = 23, D = 103;
const ROOF = 11;       // roof surface sits at y = 11 above lowest ground
const TOP = ROOF - 1;  // top block layer (cornice)
const PARAPET = TOP - 1;
const STOREY = 5;      // storey line between the two floors

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
let minG = Infinity;
for (const [, , gr] of cells) minG = Math.min(minG, gr);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr - minG);
const has = (x, z) => ground.has(key(x, z));

// footprint centroid and radius, used for the roof setback and entrance alignment
let sx = 0, sz = 0, n = 0;
for (const [x, z] of cells) { sx += x; sz += z; n++; }
const CX = Math.round(sx / n), CZ = Math.round(sz / n);
let R = 0;
for (const [x, z] of cells) R = Math.max(R, Math.hypot(x - CX, z - CZ));
const PH_R = R * 0.42; // rooftop penthouse radius

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const GLASS_NS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const GLASS_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// entrances sit on the N and S faces at the footprint's centre column
const isInnerPH = (x, z) => has(x, z) && Math.hypot(x - CX, z - CZ) < PH_R;

for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);

  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const nN = !has(x, z - 1), nS = !has(x, z + 1);
  const nW = !has(x - 1, z), nE = !has(x + 1, z);
  const edge = nN || nS || nW || nE;

  // ground floor slab
  put(x, gr, z, edge ? "polished_granite" : "polished_andesite");
  if (gr >= ROOF) continue;

  // interior storey slab and roof deck
  if (!edge) {
    if (STOREY > gr) put(x, STOREY, z, "smooth_quartz");
    put(x, TOP, z, "light_gray_concrete");
    // sparse green roof patches, standing on the roof deck
    if (x % 9 === 2 && z % 11 === 4) put(x, ROOF, z, "moss_block");
  }

  // rooftop penthouse setback, centred on the footprint
  if (!edge && isInnerPH(x, z)) {
    const innerEdge =
      !isInnerPH(x, z - 1) || !isInnerPH(x, z + 1) ||
      !isInnerPH(x - 1, z) || !isInnerPH(x + 1, z);
    for (let y = ROOF; y <= ROOF + 2; y++) {
      if (innerEdge) {
        if (y === ROOF + 1) put(x, y, z, "light_gray_concrete");
        else put(x, y, z, "light_blue_stained_glass");
      }
      // interior of the penthouse stays as air
    }
    // ceiling slab of the penthouse
    put(x, ROOF + 3, z, "smooth_quartz");
    // warm light inside penthouse
    if (!innerEdge && (x * 13 + z * 7) % 17 === 0) put(x, ROOF, z, "shroomlight");
  }

  if (!edge) continue;

  // which face this perimeter cell belongs to
  const face = nN ? "N" : nS ? "S" : nW ? "W" : "E";
  const alongNS = face === "N" || face === "S";
  const along = alongNS ? x : z;
  const inward = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] }[face];
  const entranceFace = face === "N" || face === "S";
  const isEntranceCol = entranceFace && Math.abs(along - CX) <= 2;
  const isDoorCol = entranceFace && along === CX;

  // coping ring on top of the parapet
  put(x, ROOF, z, "smooth_quartz");

  for (let y = gr + 1; y <= TOP; y++) {
    // cornice and parapet
    if (y === TOP) { put(x, y, z, "smooth_quartz"); continue; }
    if (y === PARAPET) { put(x, y, z, "white_concrete"); continue; }
    // storey line
    if (y === STOREY) { put(x, y, z, "smooth_quartz"); continue; }

    const gfWindow = y > gr && y < STOREY && y >= gr + 1 && y <= gr + 3;
    const upWindow = y >= 6 && y <= 8;

    // entrance: canopy lintel above, door and glazed shopfront below
    if (isEntranceCol && y === gr + 3) { put(x, y, z, "dark_prismarine"); continue; }
    if (isDoorCol && (y === gr + 1 || y === gr + 2)) {
      const facing = face === "N" ? "north" : "south";
      const half = y === gr + 1 ? "lower" : "upper";
      put(x, y, z, "dark_oak_door", {
        facing, half, hinge: "left", open: "false", powered: "false",
      });
      continue;
    }
    if (isEntranceCol && y <= gr + 2) {
      put(x, y, z, "light_blue_stained_glass");
      continue;
    }

    if (gfWindow || upWindow) {
      // vertical mullions every 4 cells give the facade its rhythm
      if (along % 4 === 0) {
        put(x, y, z, "light_gray_concrete");
      } else {
        put(x, y, z, "light_blue_stained_glass_pane", alongNS ? GLASS_NS : GLASS_EW);
        // warm light behind some panes
        const ix = x + inward[0], iz = z + inward[1];
        if (has(ix, iz) && (x * 31 + z * 17 + y * 7) % 13 === 0) {
          put(ix, y, iz, "glowstone");
        }
      }
    } else {
      put(x, y, z, "white_concrete");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
