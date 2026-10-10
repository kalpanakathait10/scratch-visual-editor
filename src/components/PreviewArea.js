import React, { useEffect, useRef, useState } from "react";
import CatSprite from "./CatSprite";
import { STAGE_W, STAGE_H } from "../engine";

function Bubble({ say }) {
  const think = say.kind === "think";
  return (
    <div
      className="absolute left-1/2 whitespace-nowrap bg-white border-2 border-gray-400 text-gray-800 text-sm px-3 py-1 z-10"
      style={{
        bottom: "100%",
        transform: "translateX(-50%)",
        borderRadius: think ? 999 : 12,
      }}
    >
      {say.text}
      {think && (
        <>
          <span className="absolute w-2 h-2 rounded-full bg-white border-2 border-gray-400" style={{ left: "50%", bottom: -12 }} />
          <span className="absolute w-1 h-1 rounded-full bg-white border border-gray-400" style={{ left: "50%", bottom: -18 }} />
        </>
      )}
    </div>
  );
}

// `running` enables a short CSS transition so movement is smooth between ticks;
// when idle (reset/edit) sprites jump instantly.
function Stage({ sprites, pose, running }) {
  const box = useRef(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const ro = new ResizeObserver(() =>
      setScale(box.current.clientWidth / STAGE_W)
    );
    ro.observe(box.current);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={box} className="w-full border border-gray-300 rounded overflow-hidden" style={{ height: STAGE_H * scale }}>
      <div className="relative bg-white" style={{ width: STAGE_W, height: STAGE_H, transform: `scale(${scale})`, transformOrigin: "top left" }}>
        {sprites.map((s) => {
          const p = pose[s.id];
          if (!p) return null;
          return (
            <div
              key={s.id}
              className="absolute"
              style={{
                left: STAGE_W / 2 + p.x - 48,
                top: STAGE_H / 2 - p.y - 50,
                transition: running ? "left 33ms linear, top 33ms linear" : "none",
              }}
            >
              {p.say && <Bubble say={p.say} />}
              <div style={{ transform: `rotate(${p.dir - 90}deg)`, transition: running ? "transform 33ms linear" : "none", filter: `hue-rotate(${s.hue}deg)` }}>
                <CatSprite />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const btn =
  "flex-none px-3 py-1 rounded text-white text-sm font-medium shadow transform transition active:scale-95 hover:shadow-md";

export default function PreviewArea({
  sprites, pose, activeId, running, swaps,
  onSelect, onAdd, onDelete, onPlay, onStop, onReset,
}) {
  return (
    <div className="flex-1 min-w-0 h-full overflow-y-auto p-2 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <button className={`${btn} bg-green-500 hover:bg-green-600`} onClick={onPlay}>
          ▶ Play
        </button>
        <button className={`${btn} bg-red-500 hover:bg-red-600`} onClick={onStop}>
          ■ Stop
        </button>
        <button className={`${btn} bg-gray-500 hover:bg-gray-600`} onClick={onReset}>
          ↺ Reset
        </button>
        <span className="ml-auto text-xs text-gray-500 whitespace-nowrap">
          {running ? "● " : ""}
          Swaps: {swaps}
        </span>
      </div>
      <Stage sprites={sprites} pose={pose} running={running} />
      <div>
        <div className="flex items-center mb-2">
          <div className="font-bold text-sm">Sprites</div>
          <button className={`${btn} bg-blue-500 hover:bg-blue-600 ml-auto`} onClick={onAdd}>
            + Add Sprite
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {sprites.map((s) => (
            <div
              key={s.id}
              onClick={() => onSelect(s.id)}
              className={`relative cursor-pointer border-2 rounded p-1 transition hover:shadow-md hover:bg-gray-50 w-24 text-center text-xs ${
                s.id === activeId ? "border-blue-500 bg-blue-50" : "border-gray-200"
              }`}
            >
              <div className="h-10 overflow-hidden flex justify-center" style={{ filter: `hue-rotate(${s.hue}deg)` }}>
                <div style={{ transform: "scale(0.4)", transformOrigin: "top center", width: 95, height: 100 }}>
                  <CatSprite />
                </div>
              </div>
              {s.name}
              {sprites.length > 1 && (
                <button
                  title="Delete sprite"
                  className="absolute top-0 right-1 text-gray-400 hover:text-red-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(s.id);
                  }}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
