// 201006.0007863: 3550 West Pacific Avenue, a two-storey mixed-use block of the Presidio's Mission Revival years: white
// stucco over a stone base, a red tile roof behind a parapet, and a shopfront on the street (north) side under a red
// tile hood. Roof is 5 blocks above its lowest ground (roof deck at y 5). Walls are one block thick, so the rooms
// behind the glass are air, and a few windows have a glowstone just inside.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/sf/presidio-tunnel-tops/fill";
const cells = JSON.parse(readFileSync(`${DIR}/201006.0007863.cells.json`, "utf8"));   // [x, z, ground]

const ground = new Map(cells.map(([x, z, g]) => [`${x},${z}`, g]));
const inside = (x, z) => ground.has(`${x},${z}`);

// Exterior faces of a footprint cell: every side with no footprint cell beyond it.
const facesOf = (x, z) => {
  const f = [];
  if (!inside(x, z - 1)) f.push("N");
  if (!inside(x, z + 1)) f.push("S");
  if (!inside(x - 1, z)) f.push("W");
  if (!inside(x + 1, z)) f.push("E");
  return f;
};
// One step inside from a wall cell: where the room behind its glass is.
const inward = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };

const g = new Voxels([12, 17, 13]);
const STONE = "stone_bricks", BASE = "polished_andesite", STUCCO = "white_concrete", QUOIN = "smooth_quartz";
const BAND = "smooth_quartz", ROOF = "red_terracotta", PARAPET = "white_concrete", FASCIA = "dark_oak_planks";
const pane = (f) => ({ north: f === "W" || f === "E" ? "true" : "false", south: f === "W" || f === "E" ? "true" : "false",
                       east: f === "N" || f === "S" ? "true" : "false", west: f === "N" || f === "S" ? "true" : "false",
                       waterlogged: "false" });

// The street side is the north face. Its ground floor is a shopfront: glass in every bay, dark wood piers, a
// fascia over it, and the entrance (a double door) in the middle, under a red tile hood.
const DOOR = [6, 7], DOOR_Z = 1;

// Foundation: solid from y 0 up to each cell's ground (a one-block step on the sloped west and south side).
for (const [x, z, gr] of cells) for (let y = 0; y <= gr; y++) g.set(x, y, z, STONE);

let lights = 0;
for (const [x, z, gr] of cells) {
  const faces = facesOf(x, z);
  if (!faces.length) {
    // Interior: floor slabs at y 3 (and the foundation), air in the storeys, roof deck at y 5.
    g.set(x, 3, z, "smooth_quartz");
    g.set(x, 5, z, ROOF);
    continue;
  }
  const f = faces[0];                                  // the one face a cell stands on (corners get quoins below)
  const corner = faces.length > 1;
  const street = faces.includes("N");                  // the north face is the shopfront side
  const c = f === "N" || f === "S" ? x : z;            // position along the face
  const window = !corner && c % 2 === 1;               // odd bays are windows, even bays are piers
  const door = street && z === DOOR_Z && DOOR.includes(x);

  // Base course.
  g.set(x, 1, z, corner ? QUOIN : BASE);

  // Ground storey, y 2: shopfront glass on the street, windows elsewhere, piers between.
  if (door) {
    g.set(x, 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: x === DOOR[0] ? "left" : "right", open: "false", powered: "false" });
    g.set(x, 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: x === DOOR[0] ? "left" : "right", open: "false", powered: "false" });
  } else if (street && !corner) {
    g.set(x, 2, z, "glass_pane", pane(f));
  } else if (window) {
    g.set(x, 2, z, "glass_pane", pane(f));
  } else {
    g.set(x, 2, z, corner ? QUOIN : (street ? FASCIA : STUCCO));
  }

  // Floor band at y 3: a string course, the shopfront fascia on the street (the sign board), and the red tile hood
  // over the entrance.
  if (door) g.set(x, 3, z, ROOF);
  else if (street && !corner) g.set(x, 3, z, FASCIA);
  else g.set(x, 3, z, BAND);

  // Upper storey, y 4: windows in the odd bays, stucco piers between.
  if (window) {
    g.set(x, 4, z, "glass_pane", pane(f));
  } else {
    g.set(x, 4, z, corner ? QUOIN : STUCCO);
  }

  // Cornice at y 5 and a parapet at y 6 with a coping slab on top at y 7.
  g.set(x, 5, z, QUOIN);
  g.set(x, 6, z, PARAPET);
  g.set(x, 7, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });

  // Warm light: a glowstone just inside some ground and upper windows, in the room's air.
  if (window && (x * 5 + z * 3) % 7 === 0) {
    const [dx, dz] = inward[f], ix = x + dx, iz = z + dz;
    if (inside(ix, iz)) { g.set(ix, 2, iz, "glowstone"); lights++; }
  }
  if (window && (x * 3 + z * 7) % 9 === 4) {
    const [dx, dz] = inward[f], ix = x + dx, iz = z + dz;
    if (inside(ix, iz)) { g.set(ix, 4, iz, "shroomlight"); lights++; }
  }
}

// Entrance lantern hung in the shop, under the hood (the floor at y 3 is its ceiling).
g.set(DOOR[0], 2, DOOR_Z + 1, "lantern", { hanging: "true", waterlogged: "false" });

// Roof: a 2x2 air-conditioning unit, a brick chimney flue and a lightning rod on the red tile.
for (let x = 8; x <= 9; x++) for (let z = 4; z <= 5; z++) g.set(x, 6, z, "light_gray_concrete");
for (let y = 6; y <= 8; y++) g.set(3, y, 6, "bricks");
g.set(8, 6, 8, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

const res = g.save(`${DIR}/201006.0007863.nbt`);
console.log(JSON.stringify({ built: "201006.0007863", ...res, lights }));
