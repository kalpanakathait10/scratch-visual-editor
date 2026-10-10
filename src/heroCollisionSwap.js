// HERO FEATURE: collision-based animation swap.
// When two sprites touch, they swap their running programs.
const HIT = 70; // collision box (px) between sprite centres

// Keys ("idA|idB") of all sprite pairs whose centres are within HIT on both axes.
const collisions = (ids, pose) => {
  const now = new Set();
  for (let a = 0; a < ids.length; a++) {
    for (let b = a + 1; b < ids.length; b++) {
      const p = pose[ids[a]];
      const q = pose[ids[b]];
      if (Math.abs(p.x - q.x) < HIT && Math.abs(p.y - q.y) < HIT) {
        now.add(ids[a] + "|" + ids[b]);
      }
    }
  }
  return now;
};

// Only sprites that are both running and present on the stage.
const liveIds = (execs, pose) => Object.keys(execs).filter((id) => pose[id]);

// Pairs already overlapping when Play is pressed shouldn't swap immediately.
export const initialTouching = (execs, pose) =>
  collisions(liveIds(execs, pose), pose);

// On first contact of two sprites, swap their running programs
// (including loop progress), so each continues with the other's animation.
export function swapOnCollision(sim, pose) {
  const now = collisions(liveIds(sim.execs, pose), pose);
  // sim.touching = pairs overlapping last tick; swap only on new contact,
  // otherwise a pair would swap every tick while still overlapping.
  let swaps = 0;
  now.forEach((key) => {
    if (sim.touching.has(key)) return;
    const [a, b] = key.split("|");
    const tmp = sim.execs[a].stack;
    sim.execs[a].stack = sim.execs[b].stack;
    sim.execs[b].stack = tmp;
    swaps++;
  });
  sim.touching = now;
  return swaps;
}
