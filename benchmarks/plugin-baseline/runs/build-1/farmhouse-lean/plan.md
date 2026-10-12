# Farmhouse-Lean: Build Plan

## Site Layout & Massing

- **Farmhouse** (main): x: 0-18, z: 0-14, y: 0-10 (two storeys, 9 blocks wide × 7 deep)
- **Chimney**: x: 6-7, z: 4-5, y: 5-14 (brick stack, extends above roof)
- **Porch/lean-to**: x: 14-18, z: 10-14, y: 0-2 (entry from garden side)
- **Potager boundary wall**: stone brick fence line at x: 20-40, z: 2-28 (rectangular enclosure)
- **Tool shed**: x: 28-31, z: 22-25, y: 0-3 (4×4 footprint)
- **Cold frame**: x: 34, z: 20-22, y: 0-1.5 (small structure)
- **Centre feature (well)**: x: 30, z: 14 (crafting table)
- **Fruit trees**: x: 35-37, z: 4-8 (against east wall)
- **Bean arch**: x: 30, z: 10 (entrance from house to garden)

## Palette by Role

| Role | Blocks |
|------|--------|
| Walls (farmhouse) | stone bricks, mossy stone bricks |
| Trim/quoins | chiseled stone bricks, smooth stone |
| Roof | dark oak wood (slates equiv.), dark oak stairs |
| Chimney | red bricks, red terracotta |
| Shutters | oak trapdoors, dark oak trapdoors |
| Porch/lean-to | oak stairs, oak slabs, dark oak logs |
| Garden fence | stone brick fence, posts |
| Raised beds | dark oak fence, composter |
| Paths | gravel, light gray concrete |
| Lanterns | lantern blocks (yellow glow) |
| Features (well/shed door) | crafting table, oak door |
| Vegetation | wheat, carrots, potatoes, beetroot, oak leaves |

## Generator Code Structure

- **house.mjs** – main two-storey box, walls, floors, basic openings
- **chimney.mjs** – brick chimney from floor to above roof
- **porch.mjs** – lean-to entry structure
- **roof.mjs** – mcd roof preset application
- **potager.mjs** – garden boundary, raised beds, paths
- **structures.mjs** – shed, cold frame, well, arch
- **details.mjs** – shutters, lanterns, crops, finish
- **build.mjs** – orchestrates all phases

## Build Checklist

- [ ] Hour 0–2 min: write house.mjs (main shell, openings)
- [ ] Hour 0–3 min: save build.nbt (plain box, whole building)
- [ ] Hour 3–5 min: write chimney.mjs, porch.mjs, run roof preset
- [ ] Hour 5–7 min: save build.nbt (with roof, chimney, porch)
- [ ] Hour 7–10 min: write potager.mjs, structures.mjs (beds, shed, well, arch)
- [ ] Hour 10–12 min: save build.nbt (with garden layout)
- [ ] Hour 12–15 min: write details.mjs (shutters, lanterns, crops, finish), final render
- [ ] Hour 15 min: save final build.nbt, write gaps.md

## Working Notes

- Chimney goes above roof peak (14 blocks = above the 10-block wall + 4-block roof pitch)
- Potager is symmetrical; main path runs north-south (x: 30)
- All Minecraft materials must be explicit blocks (trapdoors for shutters, not colored blocks for windows)
- Landscape stays within 40×36 footprint
