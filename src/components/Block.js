import React, { createContext, useContext, useState } from "react";
import Icon from "./Icon";
import { DEFS } from "../blocks";

// { dragRef, drop(parentId, index), setArg(id, key, value) }
// Shared by palette/script blocks: dragRef holds what is being dragged
// ({kind:"new", type} from palette, {kind:"move", id} from script) because
// dataTransfer can't be read during dragover.
export const ScriptContext = createContext(null);

const COLORS = {
  motion: "bg-blue-500",
  looks: "bg-purple-500",
  control: "bg-yellow-500",
};

function Field({ block, name, type = "number", palette }) {
  const ctx = useContext(ScriptContext);
  const value = block.args[name];
  if (palette) {
    return (
      <span className="bg-white text-gray-700 rounded-full px-2 mx-1">
        {String(value)}
      </span>
    );
  }
  return (
    <input
      type={type}
      value={value}
      draggable={false}
      onChange={(e) => ctx.setArg(block.id, name, e.target.value)}
      className={`text-gray-800 rounded-full px-1 mx-1 text-center outline-none ${
        type === "number" ? "w-14" : "w-20"
      }`}
    />
  );
}

function label(block, palette) {
  const f = (name, type) => (
    <Field block={block} name={name} type={type} palette={palette} />
  );
  switch (block.type) {
    case "move":
      return <>Move {f("steps")} steps</>;
    case "turnRight":
      return (
        <>
          Turn <Icon name="redo" size={15} className="mx-1" /> {f("degrees")}{" "}
          degrees
        </>
      );
    case "turnLeft":
      return (
        <>
          Turn <Icon name="undo" size={15} className="mx-1" /> {f("degrees")}{" "}
          degrees
        </>
      );
    case "goto":
      return (
        <>
          Go to x: {f("x")} y: {f("y")}
        </>
      );
    case "say":
      return (
        <>
          Say {f("text", "text")} for {f("secs")} seconds
        </>
      );
    case "think":
      return (
        <>
          Think {f("text", "text")} for {f("secs")} seconds
        </>
      );
    case "repeat":
      return <>Repeat {f("times")} times</>;
    default:
      return null;
  }
}

// Thin target between blocks; grows and highlights while a drag is over it.
// stopPropagation keeps outer drop zones (e.g. the script area) from also firing.
function DropSlot({ parentId, index, empty }) {
  const ctx = useContext(ScriptContext);
  const [over, setOver] = useState(false);
  return (
    <div
      onDragOver={(e) => {
        if (!ctx.dragRef.current) return;
        e.preventDefault();
        e.stopPropagation();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setOver(false);
        ctx.drop(parentId, index);
      }}
      className={`rounded transition-all ${
        over
          ? "h-8 bg-gray-300 border-2 border-dashed border-gray-500"
          : empty
          ? "h-5"
          : "h-2"
      }`}
    />
  );
}

// A vertical list of blocks with a drop slot before and after each one.
export function BlockList({ list, parentId = null }) {
  return (
    <div>
      <DropSlot parentId={parentId} index={0} empty={list.length === 0} />
      {list.map((b, i) => (
        <React.Fragment key={b.id}>
          <Block block={b} />
          <DropSlot parentId={parentId} index={i + 1} />
        </React.Fragment>
      ))}
    </div>
  );
}

export default function Block({ block, palette = false }) {
  const ctx = useContext(ScriptContext);
  const color = COLORS[DEFS[block.type].category];
  const onDragStart = (e) => {
    e.stopPropagation(); // nested blocks must not start the parent's drag
    e.dataTransfer.setData("text/plain", block.type);
    e.dataTransfer.effectAllowed = "move";
    ctx.dragRef.current = palette
      ? { kind: "new", type: block.type }
      : { kind: "move", id: block.id };
  };
  const onDragEnd = () => (ctx.dragRef.current = null);
  const header = `flex flex-row flex-wrap items-center ${color} text-white px-2 py-1 text-sm cursor-grab active:cursor-grabbing select-none shadow-sm transition-shadow hover:shadow-md`;

  if (block.type === "repeat") {
    return (
      <div draggable onDragStart={onDragStart} onDragEnd={onDragEnd} className="my-1">
        <div className={`${header} rounded-t`}>{label(block, palette)}</div>
        <div className="flex">
          <div className={`w-3 flex-none ${color}`} />
          <div className="flex-1 min-w-0">
            {palette ? (
              <div className="h-5" />
            ) : (
              <BlockList list={block.body} parentId={block.id} />
            )}
          </div>
        </div>
        <div className={`${color} h-3 rounded-b`} />
      </div>
    );
  }
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`${header} rounded my-1`}
    >
      {label(block, palette)}
    </div>
  );
}
