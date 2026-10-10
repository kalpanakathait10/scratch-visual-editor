import { swapOnCollision } from "./heroCollisionSwap";

export const STAGE_W = 480;
export const STAGE_H = 360;
export const TICK_MS = 33;
const MX = STAGE_W / 2 - 20;
const MY = STAGE_H / 2 - 20;
const clamp = (v, m) => Math.max(-m, Math.min(m, v));
const num = (v) => Number(v) || 0;

// Per-sprite program state: a stack of frames, one per script/repeat being run.
// frame = {list, i: next block index, left: loops remaining, loop: is repeat}.
// `wait` is ms left for a say/think block.
export const createExec = (script) => ({
  stack: [{ list: script, i: 0, left: 0, loop: false }],
  wait: 0,
});

// Advance one sprite by one tick. Mutates `pose` ({x,y,dir,say}) and `ex`.
// Yields at the end of each repeat iteration and during say/think waits.
export function stepSprite(ex, pose) {
  if (ex.wait > 0) {
    ex.wait -= TICK_MS;
    if (ex.wait > 0) return;
    pose.say = null;
  }
  let guard = 0;
  while (ex.stack.length && guard++ < 10000) {
    const f = ex.stack[ex.stack.length - 1];
    if (f.i >= f.list.length) {
      if (f.loop && --f.left > 0) {
        f.i = 0;
        return;
      }
      ex.stack.pop();
      continue;
    }
    const { type, args, body } = f.list[f.i++];
    switch (type) {
      case "move": {
        // dir 90 = right, 0 = up (Scratch convention); y grows upward
        const r = (pose.dir * Math.PI) / 180;
        pose.x = clamp(pose.x + num(args.steps) * Math.sin(r), MX);
        pose.y = clamp(pose.y + num(args.steps) * Math.cos(r), MY);
        break;
      }
      case "turnRight":
        pose.dir += num(args.degrees);
        break;
      case "turnLeft":
        pose.dir -= num(args.degrees);
        break;
      case "goto":
        pose.x = clamp(num(args.x), MX);
        pose.y = clamp(num(args.y), MY);
        break;
      case "say":
      case "think": {
        const ms = num(args.secs) * 1000;
        if (ms <= 0) break;
        pose.say = { text: String(args.text), kind: type };
        ex.wait = ms;
        return;
      }
      case "repeat": {
        const n = Math.floor(num(args.times));
        if (n > 0) ex.stack.push({ list: body, i: 0, left: n, loop: true });
        break;
      }
      default:
    }
  }
}

// One simulation step for all sprites. `pose` is {id: {x, y, dir, say}}.
// Returns a new pose object (React state must not be mutated), the number of
// collision swaps this tick, and whether any sprite is still running.
export function tickWorld(sim, pose) {
  // copy poses so stepSprite can mutate them freely
  const next = {};
  Object.keys(pose).forEach((id) => (next[id] = { ...pose[id] }));
  Object.keys(sim.execs).forEach((id) => {
    if (next[id]) stepSprite(sim.execs[id], next[id]);
  });
  const swaps = swapOnCollision(sim, next);
  const alive = Object.values(sim.execs).some((e) => e.stack.length || e.wait > 0);
  return { pose: next, swaps, alive };
}
