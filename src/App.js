import React, { useEffect, useMemo, useRef, useState } from "react";
import Sidebar from "./components/Sidebar";
import MidArea from "./components/MidArea";
import PreviewArea from "./components/PreviewArea";
import { ScriptContext } from "./components/Block";
import { applyDrop, createBlock, removeBlock, setArg, uid } from "./blocks";
import { TICK_MS, createExec, tickWorld } from "./engine";
import { initialTouching } from "./heroCollisionSwap";

const SPAWN = [[-150, 0], [150, 0], [0, 110], [0, -110], [-150, 110], [150, -110]];
const homeOf = (s) => ({ x: s.home[0], y: s.home[1], dir: 90, say: null });

const makeSprite = (i, script = []) => ({
  id: uid(),
  name: `Sprite${i + 1}`,
  hue: (i * 70) % 360,
  home: SPAWN[i % SPAWN.length],
  script,
});

// Demo from the brief: [repeat 30 [move N steps]]
const demo = (steps) => {
  const r = createBlock("repeat");
  r.args.times = 30;
  r.body = [{ ...createBlock("move"), args: { steps } }];
  return [r];
};

export default function App() {
  const [sprites, setSprites] = useState(() => [
    makeSprite(0, demo(10)),
    makeSprite(1, demo(-10)),
  ]);
  const [activeId, setActiveId] = useState(() => sprites[0].id);
  // Pose (x/y/direction/bubble) is kept in a ref as the source of truth for the
  // 33ms simulation loop (no stale closures, no side effects in state updaters);
  // `pose` state mirrors it only to trigger re-renders.
  const poseRef = useRef(null);
  if (!poseRef.current) {
    poseRef.current = Object.fromEntries(sprites.map((s) => [s.id, homeOf(s)]));
  }
  const [pose, setPose] = useState(poseRef.current);
  const [running, setRunning] = useState(false);
  const [swaps, setSwaps] = useState(0);
  const sim = useRef(null); // running programs + touching pairs (see engine.js)
  const dragRef = useRef(null);
  const counter = useRef(2);

  const commit = (next) => {
    poseRef.current = next;
    setPose(next);
  };

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      const r = tickWorld(sim.current, poseRef.current);
      commit(r.pose);
      if (r.swaps) setSwaps((n) => n + r.swaps);
      if (!r.alive) setRunning(false);
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [running]);

  const active = sprites.find((s) => s.id === activeId) || sprites[0];
  const activeIdRef = useRef(active.id);
  activeIdRef.current = active.id;

  // Drag-and-drop + arg editing, always applied to the sprite being edited.
  // Memoized with a stable identity: the simulation re-renders App ~30x/sec and
  // a new context value each time would re-render every block in the script.
  const ctx = useMemo(() => {
    const editActive = (fn) =>
      setSprites((ss) =>
        ss.map((s) => (s.id === activeIdRef.current ? { ...s, script: fn(s.script) } : s))
      );
    return {
      dragRef,
      drop: (parentId, index) => {
        const d = dragRef.current;
        dragRef.current = null;
        if (d) editActive((script) => applyDrop(script, d, parentId, index));
      },
      remove: () => {
        const d = dragRef.current;
        dragRef.current = null;
        if (d && d.kind === "move") editActive((script) => removeBlock(script, d.id));
      },
      setArg: (id, key, value) => editActive((script) => setArg(script, id, key, value)),
    };
  }, []);

  const play = () => {
    // start every run from the sprites' home positions so it can be replayed
    commit(Object.fromEntries(sprites.map((s) => [s.id, homeOf(s)])));
    const execs = {};
    sprites.forEach((s) => (execs[s.id] = createExec(s.script)));
    sim.current = { execs, touching: initialTouching(execs, poseRef.current) };
    setSwaps(0);
    setRunning(true);
  };
  const clearSay = () => {
    const next = {};
    Object.entries(poseRef.current).forEach(([id, p]) => (next[id] = { ...p, say: null }));
    commit(next);
  };
  const stop = () => {
    setRunning(false);
    clearSay();
  };
  const reset = () => {
    setRunning(false);
    commit(Object.fromEntries(sprites.map((s) => [s.id, homeOf(s)])));
  };
  const addSprite = () => {
    const s = makeSprite(counter.current++);
    setSprites((ss) => [...ss, { ...s, home: SPAWN[ss.length % SPAWN.length] }]);
    commit({ ...poseRef.current, [s.id]: homeOf({ ...s, home: SPAWN[sprites.length % SPAWN.length] }) });
    setActiveId(s.id);
  };
  const deleteSprite = (id) => {
    const rest = sprites.filter((s) => s.id !== id);
    setSprites(rest);
    const { [id]: _gone, ...poses } = poseRef.current;
    commit(poses);
    if (activeId === id) setActiveId(rest[0].id);
  };

  return (
    <ScriptContext.Provider value={ctx}>
      <div className="bg-blue-100 pt-6 font-sans">
        <div className="h-screen overflow-hidden flex flex-row  ">
          <div className="flex-1 h-screen overflow-hidden flex flex-row bg-white border-t border-r border-gray-200 rounded-tr-xl mr-2">
            <Sidebar /> <MidArea sprite={active} />
          </div>
          <div className="w-2/5 h-screen overflow-hidden flex flex-row bg-white border-t border-l border-gray-200 rounded-tl-xl ml-2">
            <PreviewArea
              sprites={sprites}
              pose={pose}
              activeId={active.id}
              running={running}
              swaps={swaps}
              onSelect={setActiveId}
              onAdd={addSprite}
              onDelete={deleteSprite}
              onPlay={play}
              onStop={stop}
              onReset={reset}
            />
          </div>
        </div>
      </div>
    </ScriptContext.Provider>
  );
}
