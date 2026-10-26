import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC62091";
const W = 11, H = 22, D = 20;
const ENTRANCE_X = Math.floor(W / 2);

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const map = new Map();
for (const [x, z, gr, rf] of cells) {
  const ground = Math.max(0, Math.round(gr));
  const roof = Number.isFinite(rf) ? Math.round(rf) : ground + 10;
  map.set(`${x},${z}`, { ground, roof });
}
const has = (x, z) => map.has(`${x},${z}`);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const PANE_NS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const PANE_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const [x, z] of [...map.keys()].map((k) => k.split(",").map(Number))) {
  const { ground, roof } = map.get(`${x},${z}`);

  // Storeys are 2 blocks each; the roof slab closes the top at T.
  let n = Math.max(1, Math.floor((roof - ground) / 2));
  while (ground + 2 * n + 1 > H - 1 && n > 1) n--;
  const T = ground + 2 * n;

  // Foundation up to this cell's ground.
  for (let y = 0; y < ground; y++) put(x, y, z, "stone_bricks");

  const eN = !has(x, z - 1), eS = !has(x, z + 1);
  const eW = !has(x - 1, z), eE = !has(x + 1, z);
  const perim = eN || eS || eW || eE;
  const corner = (eN || eS) && (eW || eE);

  // Facade this cell presents (non-corner perimeter cells only).
  let face = null, idx = 0, inward = null;
  if (perim && !corner) {
    if (eN) { face = "north"; idx = x; inward = [x, z + 1]; }
    else if (eS) { face = "south"; idx = x; inward = [x, z - 1]; }
    else if (eW) { face = "west"; idx = z; inward = [x + 1, z]; }
    else if (eE) { face = "east"; idx = z; inward = [x - 1, z]; }
  }

  // Entrance lintel band over the south door, flush with the wall.
  const entranceZone = eS && !corner && Math.abs(x - ENTRANCE_X) <= 1;

  for (let rel = 0; rel <= 2 * n; rel++) {
    const y = ground + rel;

    if (rel === 0) {
      // Base course: stone plinth on the perimeter, slab inside.
      put(x, y, z, perim ? "polished_andesite" : "white_concrete");
      continue;
    }
    if (rel === 2 * n) {
      // Roof slab with a smooth quartz cornice on the perimeter.
      put(x, y, z, perim ? "smooth_quartz" : "white_concrete");
      continue;
    }
    if (rel % 2 === 0) {
      // Floor line: the entrance lintel is stone, elsewhere spandrel/slab.
      if (entranceZone && rel === 3) put(x, y, z, "smooth_quartz");
      else put(x, y, z, "white_concrete");
      continue;
    }

    // Window band (odd rel): interior stays air behind the glass.
    if (!perim) continue;

    // Entrance door, ground storey, centred on the south face.
    if (eS && !corner && x === ENTRANCE_X && rel <= 2) {
      put(x, y, z, "dark_oak_door", {
        facing: "south",
        half: rel === 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }

    if (corner || !face) {
      put(x, y, z, "smooth_quartz");
      continue;
    }

    if (idx % 2 === 0) {
      // Mullion pier between bays.
      put(x, y, z, "smooth_quartz");
    } else {
      const props = (face === "north" || face === "south") ? PANE_NS : PANE_EW;
      put(x, y, z, "light_blue_stained_glass_pane", props);

      // A few warm glowstone lamps standing just inside the glass.
      if ((idx + rel) % 7 === 0 && inward) {
        const [ix, iz] = inward;
        if (has(ix, iz) && !(
          has(ix, iz - 1) && has(ix, iz + 1) && has(ix - 1, iz) && has(ix + 1, iz)
        ) === false) {
          put(ix, y, iz, "glowstone");
        }
      }
    }
  }

  // Parapet on the perimeter; roof plant boxes on interior cells.
  if (perim) {
    put(x, T + 1, z, "white_concrete");
  } else if (x % 4 === 3 && z % 6 === 2) {
    put(x, T + 1, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
