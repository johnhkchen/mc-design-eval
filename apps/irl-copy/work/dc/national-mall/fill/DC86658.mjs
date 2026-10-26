import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC86658";
const W = 29, H = 33, D = 21;
const TOP_MAX = H - 6;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup
const map = new Map();
const key = (x, z) => `${x},${z}`;
for (const [x, z, gr, roof] of cells) {
  map.set(key(x, z), { x, z, gr: Math.round(gr), roof: Math.round(roof) });
}
const has = (x, z) => map.has(key(x, z));
const perimAt = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
const inward = (x, z) => {
  if (!has(x, z - 1)) return [0, 1];
  if (!has(x, z + 1)) return [0, -1];
  if (!has(x - 1, z)) return [1, 0];
  if (!has(x + 1, z)) return [-1, 0];
  return [0, 0];
};
const TF = (b) => (b ? "true" : "false");

// Lobby span on the north face (centre of the footprint)
const LOBBY_MIN = 11, LOBBY_MAX = 17;
const DOOR_X = [13, 14];

for (const c of map.values()) {
  const { x, z, gr } = c;
  const zE = !has(x, z - 1) || !has(x, z + 1);   // facade runs along x
  const xE = !has(x - 1, z) || !has(x + 1, z);   // facade runs along z
  const perim = zE || xE;
  const corner = zE && xE;
  const northFace = !has(x, z - 1);

  // Storeys quantised to 3-block floors, driven by lidar roof height
  let n = Math.max(2, Math.round((c.roof - gr) / 3));
  n = Math.min(n, Math.floor((TOP_MAX - gr) / 3));
  const T = gr + 3 * n;

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const lobbyCell = northFace && !corner && x >= LOBBY_MIN && x <= LOBBY_MAX;

  for (let k = 0; k < n; k++) {
    const b = gr + 3 * k;

    // Storey slab / band
    if (perim) g.set(x, b, z, k === 0 ? "polished_andesite" : "smooth_quartz");
    else g.set(x, b, z, "smooth_stone");
    if (!perim) continue;

    // Ground-floor entrance: doors in the centre, glazed lobby around them
    if (k === 0 && lobbyCell) {
      if (DOOR_X.includes(x)) {
        const facing = "north";
        const hinge = x === DOOR_X[0] ? "left" : "right";
        g.set(x, b + 1, z, "dark_oak_door", { facing, half: "lower", hinge, open: "false", powered: "false" });
        g.set(x, b + 2, z, "dark_oak_door", { facing, half: "upper", hinge, open: "false", powered: "false" });
      } else {
        const props = { north: "false", south: "false", east: TF(has(x + 1, z)), west: TF(has(x - 1, z)), waterlogged: "false" };
        g.set(x, b + 1, z, "cyan_stained_glass_pane", props);
        g.set(x, b + 2, z, "cyan_stained_glass_pane", props);
        // Lanterns just inside the lobby glass
        if (x === 12 || x === 15) g.set(x, b + 1, z + 1, "lantern", { hanging: "false", waterlogged: "false" });
      }
      continue;
    }

    // Piers: corners and every third bay
    const idx = zE ? x : z;
    if (corner || idx % 3 === 0) {
      g.set(x, b + 1, z, "white_concrete");
      g.set(x, b + 2, z, "white_concrete");
      continue;
    }

    // Glass panes connected along the facade, tinted alternately
    const props = zE
      ? { north: "false", south: "false", east: TF(has(x + 1, z)), west: TF(has(x - 1, z)), waterlogged: "false" }
      : { north: TF(has(x, z - 1)), south: TF(has(x, z + 1)), east: "false", west: "false", waterlogged: "false" };
    const glass = (x + k) % 2 === 0 ? "light_blue_stained_glass_pane" : "cyan_stained_glass_pane";
    g.set(x, b + 1, z, glass, props);
    g.set(x, b + 2, z, glass, props);

    // Warm light just inside some upper-floor windows
    const [ix, iz] = inward(x, z);
    const bx = x + ix, bz = z + iz;
    if (has(bx, bz) && !perimAt(bx, bz) && (x + z + k) % 4 === 0) {
      g.set(bx, b + 1, bz, "glowstone");
    }
  }

  // Roof: cornice on perimeter, flat roof elsewhere
  g.set(x, T, z, perim ? "smooth_quartz" : "light_gray_concrete");
  if (perim) g.set(x, T + 1, z, "white_concrete");

  // Mechanical penthouse block in the middle of the roof
  if (!perim && x >= 8 && x <= 20 && z >= 6 && z <= 14) {
    g.set(x, T + 1, z, "gray_concrete");
    g.set(x, T + 2, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
