// Part: roofs and chimneys. The main hip, the dormers and trusses come from roof.json (runParts lays it after the shell);
// this part adds the four brick stacks and the hand-built shed roof over the rear porch.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { chimneyStack, CHIMNEYS } from "../vocab.mjs";

// The shell owns every cell of the stacks from the footing up through the rooms (its plinth and the room air the stacks
// stand in), so earlier parts lock those cells. This part builds the stacks from FIRST_FREE_Y up only: writes below it
// are dropped here, before they reach the lock, and chimneyStack runs unchanged on what is left.
const FIRST_FREE_Y = 18;

function abovePlate(g) {
  const view = new Proxy(g, {
    get(target, prop) {
      if (prop === "set") return (x, y, z, block, state, nbt) => {
        if (y >= FIRST_FREE_Y) target.set(x, y, z, block, state, nbt);
        return view;
      };
      const v = Reflect.get(target, prop);
      return typeof v === "function" ? v.bind(target) : v;
    },
  });
  return view;
}

// Shed roof over the rear porch (plan ROOFS, R-rearporch): high against the wing wall z75 at y10 (z76..78), low at the
// eave y9 (z79..80), stairs facing north so the slope falls to the south. Solid slate under the high rows, which sit
// on air above the porch beam (y8).
function rearPorchRoof(g) {
  const [x0, x1] = [37, 58];
  for (let x = x0; x <= x1; x++) {
    for (let z = 76; z <= 78; z++) {
      g.set(x, 9, z, "deepslate_tiles");
      g.set(x, 10, z, ...B.stairs("deepslate_tile", "north", "bottom"));
    }
    for (let z = 79; z <= 80; z++) g.set(x, 9, z, ...B.stairs("deepslate_tile", "north", "bottom"));
  }
}

export function build(g) {
  // ---- chimney stacks above the plate: through the roof, capped with a signal fire. Stacks start at y1 so the top
  // cap lands on plan y28 (the chimneyStack's own lit campfire is the top; no second fire mid-stack).
  const high = abovePlate(g);
  for (const [x, z] of CHIMNEYS) chimneyStack(high, x, z, { y: 1 });

  // ---- rear porch shed roof (the porch itself and its beam are the colonnade part's)
  rearPorchRoof(g);
}
