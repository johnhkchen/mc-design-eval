import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise 1960s-70s Taipei commercial block: two storeys over a shopfront,
// white concrete frame, light-grey bands, glazed bays, flat roof with plant.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw535173677";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 17, H = 23, D = 30;
const g = new Voxels([W, H, D]);

const STOREY1_TOP = 4;   // ground storey occupies y gr..4
const BAND_MID = 5;      // storey line / floor slab between storeys
const STOREY2_TOP = 9;   // upper storey occupies y 6..9
const ROOF_DECK = 10;    // roof slab over full footprint
const PARAPET = 11;      // parapet course on perimeter

const key = (x, z) => `${x},${z}`;
const fp = new Map(cells.map(([x, z, gr]) => [key(x, z), gr]));
const has = (x, z) => fp.has(key(x, z));

const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Door sits on the north (lowest-z) face, centred.
let minZ = Infinity;
for (const [, z] of cells) minZ = Math.min(minZ, z);
const DOOR_X = 8;
const doorCell = has(DOOR_X, minZ);

for (const [x, z, gr0] of cells) {
  const gr = Math.max(0, Math.min(gr0, 8));

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const nN = has(x, z - 1), nS = has(x, z + 1);
  const nW = has(x - 1, z), nE = has(x + 1, z);
  const exposedZ = !(nN && nS);   // north or south face
  const exposedX = !(nW && nE);   // east or west face
  const perim = exposedZ || exposedX;
  const corner = exposedZ && exposedX;

  // Position along the wall that drives the bay rhythm.
  const u = exposedZ && !exposedX ? x : z;
  const pillar = u % 3 === 0;
  const windowCell = perim && !corner && !pillar;

  // Interior direction (toward the building's centre), for lights behind glass.
  const dz = nS ? 1 : -1;
  const dx = nE ? 1 : -1;

  // Floor slabs for every storey and the roof deck, across the whole footprint.
  put(x, BAND_MID, z, "smooth_stone");
  put(x, ROOF_DECK, z, "smooth_stone");

  // Ground-floor entrance: door on the north face.
  const isDoor = doorCell && x === DOOR_X && z === minZ;

  if (perim) {
    for (let y = gr; y <= PARAPET; y++) {
      let id = "white_concrete";
      let props;

      if (y === PARAPET) {
        id = "white_concrete";
      } else if (y === ROOF_DECK) {
        id = "light_gray_concrete";
      } else if (y < BAND_MID) {
        // Ground storey.
        if (y === gr && gr < BAND_MID) {
          id = "polished_andesite";                       // base course
        } else if (y === STOREY1_TOP) {
          id = "light_gray_concrete";                     // lintel band
        } else if (isDoor) {
          if (y === gr) { id = "dark_oak_door"; props = { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" }; }
          else if (y === gr + 1) { id = "dark_oak_door"; props = { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" }; }
          else id = "light_gray_concrete";                // over the door
        } else if (windowCell && y >= gr + 1 && y <= gr + 3) {
          id = "glass";                                   // shopfront glazing
        }
      } else if (y === BAND_MID) {
        id = "light_gray_concrete";                       // storey line
      } else if (y <= STOREY2_TOP) {
        // Upper storey.
        if (y === STOREY2_TOP) id = "light_gray_concrete";
        else if (windowCell) id = "light_blue_stained_glass_pane";
      }

      if (y === PARAPET) {
        put(x, y, z, "white_concrete");
      } else if (y === ROOF_DECK) {
        put(x, y, z, "light_gray_concrete");
      } else {
        put(x, y, z, id, props);
      }
    }
  } else {
    // Interior: air above the ground-storey floor, slabs already placed.
    // Nothing else needed; the building is hollow behind the facade.
  }

  // Ceiling light over the entrance, just inside the door.
  if (isDoor) {
    put(x, gr + 2, z + 1, "lantern", { hanging: "true", waterlogged: "false" });
  }

  // Warm shroomlights just behind some upper-storey windows.
  if (windowCell && (x + z) % 4 === 0) {
    const ix = exposedZ && !exposedX ? x : x + dx;
    const iz = exposedZ && !exposedX ? z + dz : z;
    if (has(ix, iz)) put(ix, 7, iz, "shroomlight");
  }
}

// Rooftop plant: two stone boxes on the deck, clear of the parapet.
const plant = [
  [4, 12, 3, 2],
  [10, 14, 3, 2],
];
for (const [px, pz, pw, pd] of plant) {
  for (let x = px; x < px + pw; x++) {
    for (let z = pz; z < pz + pd; z++) {
      if (!has(x, z)) continue;
      put(x, PARAPET, z, "stone_bricks");
      put(x, PARAPET + 1, z, "stone_bricks");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
