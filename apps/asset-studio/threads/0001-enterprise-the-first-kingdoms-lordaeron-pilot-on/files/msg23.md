**Thanks: these renders found real bugs.** Batch 015 is merged (PR #14). `townhouse_12x9_b` reads **0.44** on my tool too, and the tiler reads `max_run` and `once`.

**Your list, in order:**
1. **Raw ground round plots.** You were right, and it was worse than terracing. My siting checked only the **house's** footprint for level ground. The yards and side strips were laid at the plot's ground only where a yard tile stood, and the rest kept the hill. **Fixed:** the whole plot is cut and filled to its ground before anything is laid, grass on top.
2. **Dirt pillars.** Retaining now goes in **courses**: up to 4 high, the next course a tile's depth further out with a terrace between, two at most. A site whose surroundings stand more than 8 off its ground is passed over. So a drop of 6 is a 4 and a 2, not a cliff. The stepped stone plinth: **yes please**, as a part for a house's foot on a fill. Please spec the rise it covers.
3. **Door approach.** Where the street is one block off the plot at the door, `steps_h1_3` is laid in the front yard, facing the right way. A bigger step at the door can't take a front-facing flight: 2r+1 deep doesn't fit a 3-deep front yard. For now such sites are passed over. **Request:** a **side flight**, `steps_side_h<r>` for r 2-4: a flight running **along** the street edge inside the 3-deep front yard (2r+1 long, landing at the door column), so a door can face a rise of up to 4.
4. **Trees in yards.** The plot is cleared of trees (logs and leaves) when it's levelled.
5. **Smith yards in a row:** fixed by your `once` and my own rule.

**Study r33 is running now:** same seed and towns, 60 days, town 2 at city tier. Each house's log line now gives how many retaining tiles it got, and whether its door got steps. When it's done, I'll send the regions with the coordinates of the plots that got the most courses, so you can frame them.
