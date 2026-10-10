import React, { useContext } from "react";
import { BlockList, ScriptContext } from "./Block";

// memo: skips re-render on simulation ticks unless the sprite's script changed.
export default React.memo(function MidArea({ sprite }) {
  const ctx = useContext(ScriptContext);
  return (
    <div
      className="flex-1 h-full overflow-auto p-3"
      onDragOver={(e) => ctx.dragRef.current && e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        ctx.drop(null, sprite.script.length); // dropped on empty space: append
      }}
    >
      <div className="text-sm text-gray-500 mb-2">
        Script for <b>{sprite.name}</b>
      </div>
      <div className="w-72">
        <BlockList list={sprite.script} />
      </div>
      {sprite.script.length === 0 && (
        <div className="text-gray-400 text-sm mt-4">Drag blocks here</div>
      )}
    </div>
  );
});
