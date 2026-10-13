// The site grid in WORLD coordinates (plan.md): x 0..38, y -5..28, z 0..32. The toolkit's Grid only takes y >= 0 and
// load() reads only that, so the grid stores y + YOFF internally and save() writes the file in that shifted frame.
// Parts, runParts and sockets.json all keep world coordinates.
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";

export const SIZE = [39, 34, 33];   // x 0..38, y -5..28, z 0..32 (the file's extent, not world numbers)
export const YOFF = 5;              // world y -5 is file y 0

export class SiteGrid extends Grid {
  constructor() { super(SIZE); }
  /** World bounds: x and z as the file, y from -YOFF up to the top. */
  inBounds(x, y, z) { return x >= 0 && z >= 0 && x < SIZE[0] && z < SIZE[2] && y >= -YOFF && y < SIZE[1] - YOFF; }
  /** Write the structure file, shifted so every y is >= 0. */
  save(path) {
    const out = new Grid(SIZE, { dataVersion: this.dataVersion });
    for (const c of this) out.set(c.pos[0], c.pos[1] + YOFF, c.pos[2], c.block, c.state, c.nbt);
    return out.save(path);
  }
}
