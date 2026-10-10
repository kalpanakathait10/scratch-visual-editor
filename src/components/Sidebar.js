import React, { useContext } from "react";
import Block, { ScriptContext } from "./Block";
import { createBlock } from "../blocks";

const GROUPS = [
  ["Motion", ["move", "turnLeft", "turnRight", "goto"]],
  ["Looks", ["say", "think"]],
  ["Control", ["repeat"]],
];

// Palette blocks never change, so build them once (not on every render).
const PALETTE = GROUPS.map(([title, types]) => [title, types.map(createBlock)]);

// memo: App re-renders every simulation tick; the palette doesn't depend on it.
export default React.memo(function Sidebar() {
  const ctx = useContext(ScriptContext);
  return (
    <div
      // dropping a script block back on the palette deletes it
      onDragOver={(e) => ctx.dragRef.current?.kind === "move" && e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        ctx.remove();
      }}
      className="w-60 flex-none h-full overflow-y-auto flex flex-col items-stretch p-2 border-r border-gray-200"
    >
      {PALETTE.map(([title, blocks]) => (
        <React.Fragment key={title}>
          <div className="font-bold mt-2">{title}</div>
          {blocks.map((b) => (
            <Block key={b.type} block={b} palette />
          ))}
        </React.Fragment>
      ))}
      <div className="text-xs text-gray-400 mt-4">
        Drag blocks to the script area. Drag a block back here to delete it.
      </div>
    </div>
  );
});
