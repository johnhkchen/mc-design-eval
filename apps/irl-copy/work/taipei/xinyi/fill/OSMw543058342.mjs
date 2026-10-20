import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw543058342";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 19, H = 23, D = 17;
const g = new Voxels([W, H, D]);
const set = (x, y, z, id, props) => g.set(x, y, z, id, props);

// Footprint lookup and common datum: lowest ground under the building.
const G = new Map(cells.map(([x, z, gr]) => [x + "," + z, gr]));
const base = Math.min(...cells.map((c) => c[2]));

// Palette: cream/white concrete mid-rise, grey frames, blue-tinted glass.
const pane = "light_blue_stained_glass_pane";
const paneX = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const paneZ = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) set(x, y, z, "stone_bricks");

  const has = (dx, dz) => G.has((x + dx) + "," + (z + dz));
  const fN = !has(0, -1), fS = !has(0, 1), fW = !has(-1, 0), fE = !has(1, 0);
  const perim = fN || fS || fW || fE;
  const alongX = fN || fS;               // facade runs east-west on north/south faces
  const t = alongX ? x : z;              // position along the facade
  const glassProps = alongX ? paneX : paneZ;

  for (let y = gr; y < H && y <= base + 12; y++) {
    const r = y - base;                  // storey-relative row (datum = lowest ground)

    if (!perim) {
      // Interior: floor slabs and roof deck only; air behind the glass.
      if (y === gr) set(x, y, z, "white_concrete");
      else if (r === 5) set(x, y, z, "white_concrete");
      else if (r === 10) set(x, y, z, "gray_concrete");
      else if (r === 11 && x >= 5 && x <= 7 && z >= 5 && z <= 7) set(x, y, z, "light_gray_concrete");
      else if (r === 12 && x === 6 && z === 6) set(x, y, z, "iron_block");
      continue;
    }

    // Perimeter facade.
    if (r === 10) { set(x, y, z, "smooth_quartz"); continue; }   // roof-edge cornice
    if (r === 11) { set(x, y, z, "stone_bricks"); continue; }    // parapet
    if (r > 11) continue;
    if (y === gr && r !== 0) { set(x, y, z, "stone_bricks"); continue; } // base course on slope
    if (r === 0) { set(x, y, z, "stone_bricks"); continue; }            // base course

    const isWin = t % 3 === 1;           // windows on piers at 1,4,7,...

    // Main entrance on the south face, centred on the pier at x = 9.
    if (fS && x === 9 && (r === 1 || r === 2)) {
      set(x, y, z, "dark_oak_door", {
        facing: "south",
        half: r === 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }
    if (fS && x === 9 && r === 3) { set(x, y, z, "gray_concrete"); continue; }

    if (r >= 1 && r <= 3) {              // shopfront band
      set(x, y, z, isWin ? pane : "white_concrete", isWin ? glassProps : undefined);
    } else if (r === 4) {                // ground-floor lintel
      set(x, y, z, "gray_concrete");
    } else if (r === 5) {                // floor slab / spandrel
      set(x, y, z, "smooth_quartz");
    } else if (r >= 6 && r <= 8) {       // upper storey windows
      if (!isWin) set(x, y, z, "white_concrete");
      else if (r === 7 && (t + z) % 4 === 0) set(x, y, z, "glowstone"); // lit room
      else set(x, y, z, pane, glassProps);
    } else if (r === 9) {                // storey line above upper windows
      set(x, y, z, "smooth_quartz");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
