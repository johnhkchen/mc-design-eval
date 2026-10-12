// Part: Roofs (parts/roofs.mjs). The main civic hip (with its two north and three south dormers) is laid by runParts from
// roof.json right after the shell. This module adds the parts the roof spec can't express as one roof: the temple gable
// over the portico and the copper spire over the clock tower, each run through `mcd roof` on a scratch copy of the build
// and copied back into air only, plus the lightning-rod finial. Roofs live in the air above the walls; nothing here
// replaces a cell an earlier part built.
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { load } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { copperSpire } from "../vocab.mjs";

const MCD = "/Volumes/ext1/swe/repos/minecraft-design/tools/bin/mcd.mjs";

// The portico's temple gable: a low gable front to the north, slate to match the main roof, the eave at y17.
const PORTICO = {
  preset: "temple",
  footprint: [14, 6, 26, 10],
  y: 17,
  pitch: 45,
  overhang: 1,
  material: {
    mix: [["cobbled_deepslate", 45], ["deepslate_tiles", 35], ["polished_deepslate", 20]],
    eave: "polished_blackstone_bricks",
    ridge: "stone_bricks",
  },
};

// The clock tower's copper spire: a steep pyramid on the shaft (x18..22 z10..14), one cell of overhang, from y36.
const SPIRE = {
  style: "pyramid",
  footprint: [18, 10, 22, 14],
  y: 36,
  pitch: 60,
  overhang: 1,
  material: {
    mix: [["weathered_cut_copper", 40], ["oxidized_cut_copper", 35], ["cut_copper", 25]],
  },
};

/** Run one roof spec on a scratch copy of the build and copy its cells back into `box` where the build is air. */
function scratchRoof(g, spec, box, dir, name) {
  const inp = join(dir, `${name}-in.nbt`);
  const out = join(dir, `${name}-out.nbt`);
  const sp = join(dir, `${name}.json`);
  g.save(inp);
  writeFileSync(sp, JSON.stringify(spec));
  execFileSync("node", [MCD, "roof", inp, out, "--spec", sp], { stdio: "pipe" });
  const r = load(out);
  const [x0, y0, z0, x1, y1, z1] = box;
  let placed = 0;
  for (const c of r) {
    const [x, y, z] = c.pos;
    if (x < x0 || x > x1 || y < y0 || y > y1 || z < z0 || z > z1) continue;
    if (c.block === "minecraft:air" || !g.isAir(x, y, z)) continue;
    g.set(x, y, z, c.block, c.state);
    placed++;
  }
  return placed;
}

export function build(g) {
  const dir = mkdtempSync(join(tmpdir(), "roofs-part2-"));
  try {
    scratchRoof(g, PORTICO, [14, 17, 6, 26, 22, 10], dir, "portico");
    scratchRoof(g, SPIRE, [17, 36, 9, 23, 41, 15], dir, "spire");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  copperSpire(g, 20, 12, 42);
}
