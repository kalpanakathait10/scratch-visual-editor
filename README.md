# Scratch-style Visual Code Editor

**Live Demo:** [https://scratch-visual-editor.netlify.app/](https://scratch-visual-editor.netlify.app/)

A small Scratch-like editor built with React 17 and Tailwind CSS. Drag blocks into a script, press Play, and sprites animate on the stage. When two sprites collide, they swap animations (the hero feature).

## Run it

```bash
npm i
npm start      # http://localhost:3000
npm run build  # production build
```

## How to use

1. **Build a script.** Drag blocks from the left palette into the middle script area.
   - Drop between blocks to insert, or on empty space to append.
   - Drag a block inside a **Repeat** to nest it.
   - Drag a block already in the script to reorder it.
   - Drag a block back onto the palette to delete it.
   - Edit the values inside a block (steps, degrees, x/y, text, seconds, repeat count).

2. **Press Play.** Every sprite runs its own script at the same time. Each Play starts from the sprites' home positions.
   - **Stop** halts the run. **Reset** puts sprites back at home.

3. **Add sprites.** Click **+ Add Sprite**. Click a sprite card to edit its script; the × deletes it (at least one sprite must remain).

4. **Try the hero feature.** Two demo sprites are preloaded:
   - Sprite1: `Repeat 30 [ Move 10 steps ]` (walks right)
   - Sprite2: `Repeat 30 [ Move -10 steps ]` (walks left)

   Press Play: they meet, swap animations, and walk back the other way. The **Swaps** counter goes up.

## Blocks

| Category | Block | What it does |
|---|---|---|
| Motion | Move N steps | Moves N px in the facing direction (negative = backwards) |
| Motion | Turn left/right N degrees | Rotates the sprite |
| Motion | Go to x: y: | Jumps to a stage position; (0,0) is the centre |
| Looks | Say ... for N seconds | Displays a speech bubble, then waits N seconds |
| Looks | Think ... for N seconds | Displays a thought bubble, then waits N seconds |
| Control | Repeat N times | Runs the blocks inside it N times |

Direction follows Scratch: 90 is right, 0 is up. Sprites are kept inside the stage.

## How it works

- **Data** (`src/blocks.js`): A script is a nested array of blocks `{id, type, args, body?}`; only `repeat` has a `body`. Tree helpers (insert, remove, move, edit) are immutable and used by drag and drop.
- **Drag and drop** (`src/components/Block.js`): Uses the browser's HTML5 drag events. Thin drop slots sit between blocks and inside each Repeat. The dragged item is kept in a ref because it can't be read from the event during dragover.
- **Engine** (`src/engine.js`): A tick-based interpreter (every 33 ms). Each sprite has a stack of frames (the script, plus one per active repeat). Per tick, a sprite runs blocks until it reaches the end of a repeat iteration or a Say/Think wait, similar to Scratch's one-frame-per-loop-pass.
- **Hero feature** (`src/heroCollisionSwap.js`): After every tick, sprite pairs whose centres are within 70 px on both axes count as colliding. On first contact, their running stacks are swapped
