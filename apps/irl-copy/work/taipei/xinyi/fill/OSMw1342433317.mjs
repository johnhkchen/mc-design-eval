import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1342433317";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 10, H = 19, D = 21;
const g = new Voxels([W, H, D]);

// Record: roof about 7 blocks above lowest ground -> low-rise 1980s commercial block,
// two storeys (ground shopfront + upper floor), cream quartz tile walls, stone plinth,
// light-blue glazing with quartz mullions, flat roof with parapet.
const minG = Math.min(...cells.map(c => c[2]));
const key = (x, z) => `${x},${z}`;
const occ = new Map(cells.map(([x, z, gr]) => [key(x, z), gr]));
const has = (x, z) => occ.has(key(x, z));

function set(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) set(x, y, z, "stone_bricks");

  const nW = !has(x - 1, z), nE = !has(x + 1, z);
  const nN = !has(x, z - 1), nS = !has(x, z + 1);
  const per = nW || nE || nN || nS;
  const corner = (nW || nE) && (nN || nS);
  const zFace = nN || nS;           // wall runs along x; along-face coordinate is x
  const s = zFace ? x : z;
  const entrance = nN && z === 0 && (x === 4 || x === 5);

  for (let h = 0; h <= 7; h++) {
    const y = minG + h;
    if (y < gr) continue;

    // Flat roof deck with parapet on the perimeter (top course at h = 6)
    if (h === 6) {
      set(x, y, z, per ? "quartz_block" : "smooth_quartz");
      continue;
    }

    // Rooftop plant boxes, interior only
    if (h === 7) {
      if (!per && x % 3 === 1 && z % 4 === 2) set(x, y, z, "light_gray_concrete");
      continue;
    }

    if (!per) {
      // Interior: floor slabs per storey, air otherwise, warm lights behind some glass
      if (h === 0) set(x, y, z, "smooth_stone");
      else if (h === 4) set(x, y, z, "smooth_quartz");
      else if ((h === 1 || h === 5) && (x + z) % 4 === 0)
        set(x, y, z, h === 1 ? "glowstone" : "shroomlight");
      continue;
    }

    // Perimeter facade
    if (corner) {
      set(x, y, z, "quartz_pillar", { axis: "y" });
      continue;
    }
    if (h === 0) { set(x, y, z, "stone_bricks"); continue; }      // plinth
    if (h === 3) { set(x, y, z, "smooth_quartz"); continue; }     // fascia
    if (h === 4) { set(x, y, z, "quartz_block"); continue; }      // storey line

    // h = 1, 2 (shopfront) and h = 5 (upper windows)
    if (entrance && (h === 1 || h === 2)) {
      set(x, y, z, "iron_door", {
        facing: "north",
        half: h === 1 ? "lower" : "upper",
        hinge: x === 4 ? "left" : "right",
        open: "false",
        powered: "false",
      });
      continue;
    }

    if (s % 3 === 0) {
      set(x, y, z, "quartz_pillar", { axis: "y" });               // mullion
    } else {
      const pane = zFace
        ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
        : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
      set(x, y, z, "light_blue_stained_glass_pane", pane);
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
