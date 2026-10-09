Detail-2 beats input, and the function check still passes (walkable end to end, function intact).

- **Treatments kept:** parapet copings (`cap F36`, `F38`), moulded cornice lips (`cornice F33–35`), stepped pediment (`stairify F9`), quartz lintels over the three apartment windows, dark-oak frames on the four shop windows, stone plinths on the east and west walls, brick-with-mud-brick mixes on the three brick fields, and a stone chimney cap (`cap F106`).
- **Dropped:** `sill` on the shop windows wrote nothing, and `lintel quartz_stairs` failed with "no such block form". Both are fixed by using the base block (`smooth_quartz`) for lintels and dropping the sills.
- **Versus input:** the cream lintels and stepped pediment bring the front closer to the concept, and the dark frames read cleaner. The stone plinths look a little like stray steps at the front-left corner, and the mud-brick speckle on the side walls is a judgment call against the concept's clean brick. I kept both.
- **Height:** the chimney cap raises the build from 15×18×15 to 15×19×15, which matches the spec's chimney top at y=18.
- **Files:** `detail-2.nbt` is the output, `plan.txt` the plan (20 ops, one edit round), and renders are in `t0/`, `t1/` (first plan, `detail-1.nbt`) and `t2/`. `input.nbt` is untouched.
