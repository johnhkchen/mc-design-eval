// Part 2, Roofs: the bakehouse wing roof via roof() (roofWing: gable on the wing rect, ridge along z at x=19, y=8), and
// the spec for the main slate roof. make.sh applies the main roof (roof.json, footprint [6,8,16,22], eave y=10) once the
// shell exists, so roofMain is not called here: running both would roof the building twice.
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { MAIN_ROOF_SPEC, roofWing } from "../vocab.mjs";

const ROOF_JSON = fileURLToPath(new URL("../roof.json", import.meta.url));

// the shell owns the wing's gable frame (x=18..20, z=13, y=6..7): the roof stops at those cells, so a write into any
// cell that was already built when this part starts is dropped here instead of being refused by runParts
function stopAtBuilt(g) {
  const built = new Set();
  for (const c of g) if (!g.isAir(...c.pos)) built.add(c.pos.join());
  const view = new Proxy(g, {
    get(target, prop) {
      if (prop === "set") return (x, y, z, ...rest) => { if (!built.has(`${x},${y},${z}`)) target.set(x, y, z, ...rest); return view; };
      if (prop === "unset") return (x, y, z) => { if (!built.has(`${x},${y},${z}`)) target.unset(x, y, z); return view; };
      return Reflect.get(target, prop);
    },
  });
  return view;
}

export function build(g) {
  writeFileSync(ROOF_JSON, JSON.stringify({ ...MAIN_ROOF_SPEC, footprint: [[6, 8, 16, 22]], y: 10 }, null, 1));
  roofWing(stopAtBuilt(g));
}
