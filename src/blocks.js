export const uid = () => Math.random().toString(36).slice(2, 10);

// Block definitions: category (sets colour) and default argument values.
// A script is a nested array of blocks: {id, type, args, body?}; only `repeat` has a body.
export const DEFS = {
  move: { category: "motion", defaults: { steps: 10 } },
  turnRight: { category: "motion", defaults: { degrees: 15 } },
  turnLeft: { category: "motion", defaults: { degrees: 15 } },
  goto: { category: "motion", defaults: { x: 0, y: 0 } },
  say: { category: "looks", defaults: { text: "Hello!", secs: 2 } },
  think: { category: "looks", defaults: { text: "Hmm...", secs: 2 } },
  repeat: { category: "control", defaults: { times: 10 } },
};

// New block instance with a unique id and its own copy of the defaults.
export const createBlock = (type) => ({
  id: uid(),
  type,
  args: { ...DEFS[type].defaults },
  ...(type === "repeat" ? { body: [] } : {}),
});

// --- immutable tree helpers (scripts are nested arrays; only `repeat` has a body) ---
export const findBlock = (list, id) => {
  for (const b of list) {
    if (b.id === id) return b;
    const hit = b.body && findBlock(b.body, id);
    if (hit) return hit;
  }
  return null;
};

// True if `id` is this block or anywhere inside its body.
export const containsId = (block, id) =>
  block.id === id || (block.body || []).some((c) => containsId(c, id));

// Where a block sits: its parent repeat id (null = top level) and index.
export const locate = (list, id, parentId = null) => {
  for (let i = 0; i < list.length; i++) {
    if (list[i].id === id) return { parentId, index: i };
    const hit = list[i].body && locate(list[i].body, id, list[i].id);
    if (hit) return hit;
  }
  return null;
};

export const removeBlock = (list, id) =>
  list
    .filter((b) => b.id !== id)
    .map((b) => (b.body ? { ...b, body: removeBlock(b.body, id) } : b));

// Immutable insert of `block` at `index`.
const splice = (list, index, block) => [
  ...list.slice(0, index),
  block,
  ...list.slice(index),
];

// Insert into the top-level list (parentId null) or into a repeat's body.
export const insertBlock = (list, parentId, index, block) =>
  parentId == null
    ? splice(list, index, block)
    : list.map((b) =>
        b.id === parentId
          ? { ...b, body: splice(b.body, index, block) }
          : b.body
          ? { ...b, body: insertBlock(b.body, parentId, index, block) }
          : b
      );

export const setArg = (list, id, key, value) =>
  list.map((b) =>
    b.id === id
      ? { ...b, args: { ...b.args, [key]: value } }
      : b.body
      ? { ...b, body: setArg(b.body, id, key, value) }
      : b
  );

// Drop a dragged block (new from palette, or existing one) at parentId/index.
export const applyDrop = (script, drag, parentId, index) => {
  if (drag.kind === "new") {
    return insertBlock(script, parentId, index, createBlock(drag.type));
  }
  const block = findBlock(script, drag.id);
  if (!block || (parentId != null && containsId(block, parentId))) return script;
  const loc = locate(script, drag.id);
  const i = loc.parentId === parentId && loc.index < index ? index - 1 : index;
  return insertBlock(removeBlock(script, drag.id), parentId, i, block);
};
