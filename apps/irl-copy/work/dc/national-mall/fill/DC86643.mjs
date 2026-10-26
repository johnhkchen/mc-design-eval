import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 1602 L St NW: Commercial-Office-Large, c. 1960s-70s. Precast/concrete office block
// with a granite base, white concrete piers, light spandrels and glass bands.
// Setbacks and roof plant follow the lidar roof heights.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC86643";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 7, H = 29, D = 19;
const g = new Voxels([W, H, D]);

const S = (x, y, z, id, p) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const cellMap = new Map();
for (const c of cells) {
  const [x, z, ground, roof] = c;
  cellMap.set(`${x},${z}`, { x, z, ground: Math.round(ground), roof: Math.round(roof) });
}
const inF = (x, z) => cellMap.has(`${x},${z}`);

const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const FACE_ORDER = ["north", "south", "west", "east"];

function primaryFace(x, z) {
  for (const f of FACE_ORDER) {
    const [dx, dz] = DIRS[f];
    if (!inF(x + dx, z + dz)) return f;
  }
  return null;
}
const isEdge = (x, z) => primaryFace(x, z) !== null;
const alongOf = (face, x, z) => (face === "north" || face === "south") ? x : z;

// Street/entrance face: prefer the north side, else any edge cell
const northEdge = [...cellMap.values()].filter(c => primaryFace(c.x, c.z) === "north");
const doorPool = northEdge.length ? northEdge : [...cellMap.values()].filter(c => isEdge(c.x, c.z));
let doorCell = null;
if (doorPool.length) {
  const mean = doorPool.reduce((s, c) => s + alongOf(primaryFace(c.x, c.z), c.x, c.z), 0) / doorPool.length;
  doorCell = doorPool.reduce((best, c) =>
    Math.abs(alongOf(primaryFace(c.x, c.z), c.x, c.z) - mean) <
    Math.abs(alongOf(primaryFace(best.x, best.z), best.x, best.z) - mean) ? c : best);
}
const doorKey = doorCell ? `${doorCell.x},${doorCell.z}` : null;
const doorFace = doorCell ? primaryFace(doorCell.x, doorCell.z) : null;

function paneProps(face) {
  const zFace = face === "north" || face === "south";
  return zFace
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
}

// Per-cell massing from the lidar roof, snapped to storey tiers
const cellInfo = [];
for (const c of cellMap.values()) {
  const gr = Math.max(0, Math.min(c.ground, 10));
  let nS = Math.max(1, Math.round((c.roof - gr) / 3));
  nS = Math.min(nS, Math.floor((H - 6 - gr) / 3));
  const t = gr + 3 * nS;
  cellInfo.push({ ...c, gr, nS, t, face: primaryFace(c.x, c.z) });
}
const infoMap = new Map(cellInfo.map(c => [`${c.x},${c.z}`, c]));

for (const c of cellInfo) {
  const { x, z, gr, nS, t, face } = c;
  const edge = face !== null;

  // Foundation up to grade
  for (let y = 0; y < gr; y++) S(x, y, z, "stone");

  if (!edge) {
    // Interior: floor slabs per storey, air between them, roof slab on top
    for (let k = 0; k < nS; k++) S(x, gr + 3 * k, z, "smooth_stone");
    S(x, t, z, "stone");
    continue;
  }

  // Facade column
  const along = alongOf(face, x, z);
  const isPier = along % 2 === 0;
  const [dx, dz] = DIRS[face];
  const ix = x - dx, iz = z - dz; // inward neighbour (behind the glass)
  const isDoorCell = doorKey === `${x},${z}` && face === doorFace;
  // Cells flanking the door get a granite surround
  const nearDoor = doorFace === face && Math.abs(along - alongOf(doorFace, doorCell.x, doorCell.z)) === 1;

  for (let k = 0; k < nS; k++) {
    const base = gr + 3 * k;

    // Storey band: base course on the ground, spandrel above
    S(x, base, z, k === 0 ? "polished_granite" : "light_gray_concrete");

    for (const w of [1, 2]) {
      const y = base + w;

      if (isDoorCell && k === 0) {
        S(x, y, z, "dark_oak_door", {
          facing: face, hinge: "left", open: "false", powered: "false",
          half: w === 1 ? "lower" : "upper",
        });
        continue;
      }

      if (k === nS - 1 && w === 2) {
        S(x, y, z, "polished_granite"); // cornice band under the roof
        continue;
      }

      if (isDoorCell === false && k === 0 && nearDoor) {
        S(x, y, z, "polished_granite"); // door surround
        continue;
      }

      if (isPier) {
        S(x, y, z, "white_concrete");
      } else {
        S(x, y, z, "light_blue_stained_glass_pane", paneProps(face));
        // Warm light behind some upper-storey windows, inside the building
        if (w === 1 && k >= 1 && along % 4 === 1 && inF(ix, iz) && !isEdge(ix, iz)) {
          S(ix, base + 1, iz, (k % 2 === 0) ? "glowstone" : "shroomlight");
        }
      }
    }
  }

  // Entrance: canopy lip over the door and a lantern standing inside the lobby
  if (isDoorCell) {
    S(x, gr + 3, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
    if (inF(ix, iz) && !isEdge(ix, iz)) {
      S(ix, gr + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }

  // Parapet
  S(x, t, z, "smooth_stone");
  S(x, t + 1, z, "smooth_stone");
}

// Roof plant: one clean penthouse block set back from the parapet, on interior roof cells
for (const c of cellInfo) {
  if (isEdge(c.x, c.z)) continue;
  if (c.x >= 2 && c.x <= 4 && c.z >= 5 && c.z <= 9) {
    S(c.x, c.t + 1, c.z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
