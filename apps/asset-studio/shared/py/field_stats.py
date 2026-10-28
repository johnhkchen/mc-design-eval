# fieldstats.py <world> x0 z0 x1 z1 [y0 y1]: crops by kind, water sources among farmland, log kinds, leaves kinds,
# walls vs hedges at ground+1, and the mean run of one crop along x (band width proxy)
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from world_render import chunks_in, Chunk
world, x0, z0, x1, z1 = sys.argv[1], *map(int, sys.argv[2:6]); y0, y1 = (int(sys.argv[6]), int(sys.argv[7])) if len(sys.argv) > 7 else (40, 140)
ch = {}
for r in Path(world, "region").glob("*.mca"):
    for n in chunks_in(r):
        cx, cz = n.get("xPos"), n.get("zPos")
        if cx * 16 + 15 < x0 or cx * 16 > x1 or cz * 16 + 15 < z0 or cz * 16 > z1: continue
        c = Chunk(n); ch[(c.cx, c.cz)] = c
crops, logs, leaves, wat, wallc, hedge = {}, {}, {}, 0, 0, 0
runs, cur, curk = [], 0, None
for z in range(z0, z1 + 1):
    curk, cur = None, 0
    for x in range(x0, x1 + 1):
        c = ch.get((x >> 4, z >> 4)); k = None
        if not c: continue
        for y in range(y1, y0, -1):
            b = c.block(x & 15, y, z & 15).replace("minecraft:", "")
            if b == "air": continue
            base = b.split("[")[0]
            if base in ("wheat", "carrots", "potatoes", "beetroots", "sweet_berry_bush", "sugar_cane"): crops[base] = crops.get(base, 0) + 1; k = base; break
            if base.endswith("_log"): logs[base] = logs.get(base, 0) + 1; break
            if base.endswith("_leaves"): leaves[base] = leaves.get(base, 0) + 1
            if base == "water":
                below = c.block(x & 15, y - 1, z & 15)
                if any("farmland" in c.block((x + dx) & 15, y, (z + dz) & 15) for dx, dz in ((1, 0), (-1, 0), (0, 1), (0, -1)) if ((x + dx) >> 4, (z + dz) >> 4) == (x >> 4, z >> 4)): wat += 1
                break
            if base.endswith("_wall"): wallc += 1; break
            if base in ("grass_block", "dirt", "stone", "farmland", "dirt_path", "sand", "gravel", "coarse_dirt"): break
        if k == curk and k: cur += 1
        else:
            if curk and cur >= 2: runs.append(cur)
            curk, cur = k, 1 if k else 0
print("crops", crops); print("logs", logs); print("leaves", {k: v for k, v in leaves.items() if v > 20})
print("water beside farmland", wat, "walls", wallc, "crop run along x: mean", round(sum(runs) / max(1, len(runs)), 1), "n", len(runs))
