import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Walsin Xinyi Building (華新麗華大樓), 2001: a blue-glass office tower with a
// two-storey shopfront podium, one setback at mid-height, and a roof plant room.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE90-0169-27F";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 70, H = 200, D = 90;
const TOP = 188;        // roof line above lowest ground (lidar)
const TIER_B = 120;     // absolute height where the setback tier starts
const INSET = 8;        // setback inset per side
const PEN_INSET = 18;   // roof plant room inset
const PODIUM = 2;       // storeys of shopfront podium
const STOREY = 5;

const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);

const inA = (x, z) => ground.has(key(x, z));
const inB = (x, z) =>
  inA(x, z) && x >= INSET && x < W - INSET && z >= INSET && z < D - INSET;

const isEdge = (x, z, S) =>
  S(x, z) && (!S(x + 1, z) || !S(x - 1, z) || !S(x, z + 1) || !S(x, z - 1));

// Exposed face of an edge cell (E, W, S or N).
const faceOf = (x, z, S) =>
  !S(x + 1, z) ? "E" : !S(x - 1, z) ? "W" : !S(x, z + 1) ? "S" : "N";

const PANE_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const PANE_NS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

// Facade of one edge cell for storey k, floor line y0.
function facade(x, z, y0, k, S) {
  const f = faceOf(x, z, S);
  const ew = f === "E" || f === "W";
  const idx = ew ? z : x;
  const span = ew ? D : W;
  const pane = ew ? PANE_EW : PANE_NS;
  const podium = k < PODIUM;
  const glass = podium ? "light_blue_stained_glass_pane" : "cyan_stained_glass_pane";
  const corner = idx === 0 || idx === span - 1;
  const entrance = k === 0 && f === "S" && idx >= 30 && idx <= 39;

  // head course (underside of the next floor)
  put(x, y0 + 4, z, "white_concrete");

  for (const dy of [1, 2, 3]) {
    const y = y0 + dy;
    if (entrance) {
      if (idx === 31 || idx === 35 || idx === 39) {
        // mullion frames the doors; hanging lantern under the head course
        if (dy === 3) put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
        else put(x, y, z, "light_gray_concrete");
      } else if (dy <= 2) {
        // recessed black glass doors
        put(x, y, z, "black_stained_glass");
      }
      continue;
    }
    if (corner || idx % 3 === 0) {
      put(x, y, z, "light_gray_concrete");          // mullion / corner pier
    } else {
      put(x, y, z, glass, pane);                     // glazing
    }
  }
}

// Foundation, storeys, setback and roof for every footprint cell.
for (const [k0, gnd] of ground) {
  const [x, z] = k0.split(",").map(Number);

  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gnd; y++) put(x, y, z, "stone_bricks");

  const nk = Math.floor((TOP - gnd) / STOREY);
  let capped = false;

  for (let k = 0; k < nk && !capped; k++) {
    const y0 = gnd + STOREY * k;
    const tierB = y0 >= TIER_B;
    const S = tierB ? inB : inA;

    // cells outside the setback stop here, capped by a roof slab
    if (tierB && !inB(x, z)) {
      put(x, y0, z, "light_gray_concrete");
      capped = true;
      break;
    }

    // floor line: lobby granite at grade, slab above
    put(x, y0, z, k === 0 ? "polished_granite" : "white_concrete");

    if (isEdge(x, z, S)) {
      facade(x, z, y0, k, S);
    } else if (k >= 1) {
      // warm lights in some rooms, one bay behind the glass
      const nearEdge =
        isEdge(x + 1, z, S) || isEdge(x - 1, z, S) ||
        isEdge(x, z + 1, S) || isEdge(x, z - 1, S);
      if (nearEdge && (x * 31 + z * 17 + k * 7) % 9 === 0) {
        put(x, y0 + 2, z, "glowstone");
      }
    }
  }

  // roof of the setback tier and parapet
  if (!capped && inB(x, z)) {
    put(x, TOP, z, "light_gray_concrete");
    if (isEdge(x, z, inB)) {
      put(x, TOP + 1, z, "white_concrete");
      put(x, TOP + 2, z, "white_concrete");
    }
  }
}

// Roof plant room, set back inside the tier.
const penCell = (x, z) =>
  inB(x, z) && x >= PEN_INSET && x < W - PEN_INSET && z >= PEN_INSET && z < D - PEN_INSET;

let mastCell = null;
for (const [k0] of ground) {
  const [x, z] = k0.split(",").map(Number);
  if (!penCell(x, z)) continue;

  const edge = isEdge(x, z, penCell);

  // solid floor and roof of the plant room
  put(x, TOP + 1, z, "light_gray_concrete");
  put(x, TOP + 7, z, "light_gray_concrete");

  if (edge) {
    for (let y = TOP + 2; y <= TOP + 6; y++) {
      if (y >= TOP + 3 && y <= TOP + 5) {
        put(x, y, z, "iron_bars", { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" });
      } else {
        put(x, y, z, "light_gray_concrete");
      }
    }
    if (x % 7 === 0) put(x, TOP + 6, z, "shroomlight");
  } else if (!mastCell) {
    mastCell = [x, z];
  }
}

// Mast on the plant room, on an interior cell of the roof.
if (mastCell) {
  const [mx, mz] = mastCell;
  for (let y = TOP + 8; y <= TOP + 11; y++) put(mx, y, mz, "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);
