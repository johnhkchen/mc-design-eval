# census.py <world> x0 z0 x1 z1: in 32-block bins, farmland, hedge (persistent leaves at ground+1), water, tree logs;
# then the whole box's totals and field metrics for comparing with the demo
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from world_render import chunks_in, Chunk
world, x0, z0, x1, z1 = sys.argv[1], *map(int, sys.argv[2:6])
ch = {}
for r in Path(world, "region").glob("*.mca"):
    for n in chunks_in(r):
        cx, cz = n.get("xPos"), n.get("zPos")
        if cx * 16 + 15 < x0 or cx * 16 > x1 or cz * 16 + 15 < z0 or cz * 16 > z1: continue
        c = Chunk(n); ch[(c.cx, c.cz)] = c
T = {}
bins = {}
for x in range(x0, x1 + 1):
    for z in range(z0, z1 + 1):
        c = ch.get((x >> 4, z >> 4))
        if not c: continue
        if c.ground: g = c.ground[(z & 15) * 16 + (x & 15)] - 65
        else:
            g = 90
            while g > 0 and any(s in c.block(x & 15, g, z & 15) for s in ("air", "leaves", "log", "wheat", "carrots", "potatoes", "beetroots", "short_grass", "tall_grass", "fern", "flower", "wall", "fence", "gate", "cane", "lantern", "slab", "cauldron", "hay", "poppy", "dandelion", "tulip", "orchid", "bluet", "daisy", "cornflower")): g -= 1
        top = c.block(x & 15, g, z & 15); a1 = c.block(x & 15, g + 1, z & 15); a2 = c.block(x & 15, g + 2, z & 15)
        k = None
        if "farmland" in top or "farmland" in c.block(x & 15, g - 1, z & 15): k = "farmland"
        elif "water" in top: k = "water"
        elif "leaves" in a1 or "leaves" in top: k = "leaves_low"
        elif "log" in a1 or "log" in top: k = "trunk"
        elif "wall" in a1 or "wall" in top: k = "wall"
        elif "fence" in a1 or "fence" in top: k = "fence"
        elif "path" in top: k = "path"
        else: k = "other:" + top.replace("minecraft:", "").split("[")[0]
        T[k] = T.get(k, 0) + 1
        b = ((x - x0) // 32, (z - z0) // 32); bins.setdefault(b, {}); bins[b][k] = bins[b].get(k, 0) + 1
print(sorted(T.items(), key=lambda kv: -kv[1])[:16])
print("farmland by 32-bin (x,z):", sorted([(b, d.get("farmland", 0)) for b, d in bins.items() if d.get("farmland", 0) > 150], key=lambda t: -t[1])[:12])
