# field_census.py <world> x0 z0 x1 z1 [--json]: in 32-block bins, farmland, hedge (persistent leaves at ground+1), water, tree logs;
# then the whole box's totals and field metrics for comparing with the demo
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from world_render import chunks_in, Chunk
args = [a for i, a in enumerate(sys.argv[1:], 1) if not a.startswith("--") and sys.argv[i - 1] not in ("--near", "--mask", "--town")]  # "--" flags only: a coordinate may be negative
world, x0, z0, x1, z1 = (args[0], *map(int, args[1:5])) if len(args) >= 5 else (args[0], 0, 0, 0, 0)
# --mask fields.json --town id: count only the cells of that town's fields (py/fields_mask.py's run-length mask), and
# report the planted share over its crop fields (use arable/terraces) exactly
mask = None
if "--mask" in sys.argv:
    import json
    M = json.load(open(sys.argv[sys.argv.index("--mask") + 1]))["towns"][sys.argv[sys.argv.index("--town") + 1] if "--town" in sys.argv else "0"]
    ids, rle = [], M["field"]
    for k in range(0, len(rle), 2): ids.extend([rle[k]] * rle[k + 1])
    use = {f.get("id", i): f.get("use") for i, f in enumerate(M.get("fields", []))}
    mask = (M["x0"], M["z0"], M["sx"], M["sz"], ids, use)
    x0, z0, x1, z1 = M["x0"], M["z0"], M["x0"] + M["sx"] - 1, M["z0"] + M["sz"] - 1
def field_of(x, z):
    if not mask: return 0
    mx, mz, sx, sz, ids, _ = mask
    return ids[(z - mz) * sx + (x - mx)] if 0 <= x - mx < sx and 0 <= z - mz < sz else -1
ch = {}
for r in Path(world, "region").glob("*.mca"):
    for n in chunks_in(r):
        cx, cz = n.get("xPos"), n.get("zPos")
        if cx * 16 + 15 < x0 or cx * 16 > x1 or cz * 16 + 15 < z0 or cz * 16 > z1: continue
        c = Chunk(n); ch[(c.cx, c.cz)] = c
T, kinds = {}, {}

bins = {}
for x in range(x0, x1 + 1):
    for z in range(z0, z1 + 1):
        c = ch.get((x >> 4, z >> 4))
        if not c: continue
        if mask and field_of(x, z) < 0: continue
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
        T[k] = T.get(k, 0) + 1; kinds[(x, z)] = k
        b = ((x - x0) // 32, (z - z0) // 32); bins.setdefault(b, {}); bins[b][k] = bins[b].get(k, 0) + 1
farm = T.get("farmland", 0) or 1
# --near n: the planted share over field ground only: grass and coarse dirt within n blocks of farmland (the whole box
# otherwise, which understates it where the box holds town or wild land)
near = int(sys.argv[sys.argv.index("--near") + 1]) if "--near" in sys.argv else 0
metrics = {"farmland": T.get("farmland", 0), "walls_per_1000_farmland": round(1000 * T.get("wall", 0) / farm), "hedge_leaves_per_1000_farmland": round(1000 * T.get("leaves_low", 0) / farm),
           "trunks_per_1000_farmland": round(1000 * T.get("trunk", 0) / farm), "planted_share": round(T.get("farmland", 0) / max(1, sum(v for k, v in T.items() if k in ("farmland", "other:grass_block", "other:coarse_dirt"))), 2)}
if mask:
    crop = {p for p in kinds if mask[5].get(field_of(*p)) in ("arable", "terraces")}
    ground = [p for p in crop if kinds[p] in ("farmland", "other:grass_block", "other:coarse_dirt")]
    metrics["planted_share_crop_fields"] = round(sum(1 for p in ground if kinds[p] == "farmland") / max(1, len(ground)), 2)
    metrics["field_cells"] = len(kinds); metrics["uses"] = {u: sum(1 for p in kinds if mask[5].get(field_of(*p)) == u) for u in set(mask[5].values())}
if near:
    fl = {p for p, k in kinds.items() if k == "farmland"}
    from collections import deque
    dist = {p: 0 for p in fl}; q = deque(fl)
    while q:
        x, z = q.popleft()
        if dist[(x, z)] >= near: continue
        for d in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            n = (x + d[0], z + d[1])
            if n in kinds and n not in dist: dist[n] = dist[(x, z)] + 1; q.append(n)
    ground = sum(1 for p in dist if kinds[p] in ("farmland", "other:grass_block", "other:coarse_dirt"))
    metrics["planted_share_fields"] = round(len(fl) / max(1, ground), 2); metrics["near"] = near
if "--json" in sys.argv:
    import json; print(json.dumps(metrics)); sys.exit(0)
print(metrics)
print(sorted(T.items(), key=lambda kv: -kv[1])[:16])
print("farmland by 32-bin (x,z):", sorted([(b, d.get("farmland", 0)) for b, d in bins.items() if d.get("farmland", 0) > 150], key=lambda t: -t[1])[:12])
