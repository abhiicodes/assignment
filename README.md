# Flow Builder

A visual flow builder SPA where users can create, edit, and export flowcharts with conditional transitions as JSON. 
## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Tech Stack

| Technology | Purpose |
|---|---|
| **Vite** | Build tool & dev server |
| **React 18 + TypeScript** | UI framework |
| **React Flow** (`@xyflow/react`) | Interactive canvas with drag, connect, custom nodes/edges |
| **Redux Toolkit** | Centralized state management with immutable updates via Immer |
| **react-syntax-highlighter** | Syntax-highlighted JSON preview |
| **Lucide React** | Icon library |
| **nanoid** | Unique ID generation |

## Design Choices

- **Redux Toolkit** was chosen over lighter alternatives for its powerful dev tools, scalability, and industry-standard patterns. The entire flow state (nodes, edges, validation errors, selection) lives in a single Redux slice with auto-revalidation on every mutation.

- **Dual edge model**: Each connection is stored both as a React Flow visual edge (for rendering) and as a flow edge inside node data (for JSON export). This keeps the schema clean while enabling full React Flow interactivity.

- **Live validation**: Validations run on every state change and surface inline errors/warnings in the sidebar, on nodes (red border), and in the JSON panel. This gives immediate feedback without modal dialogs.

- **Dark theme**: CSS custom properties for easy theming, with carefully chosen colors for accessibility. The design uses subtle gradients, glassmorphism effects, and micro-animations.

## Features

### Core
- ✅ Add, delete, and drag nodes around the canvas
- ✅ Connect nodes by drawing edges between handles
- ✅ Condition labels on each edge
- ✅ Visual "START" badge on the designated start node
- ✅ Node sidebar: edit ID, description, prompt, manage edges
- ✅ Live syntax-highlighted JSON preview

### Validations
- ✅ Unique node IDs (inline error)
- ✅ Required description fields
- ✅ Start node must exist
- ✅ Inline error messages (field-level + node-level)

### Bonus
- ✅ Import JSON to reconstruct flow on canvas
- ✅ Copy JSON to clipboard
- ✅ Download JSON as file
- ✅ Delete key removes selected node/edge
- ✅ Disconnected node warnings
- ✅ Editable/removable edge parameters (key-value pairs)

## JSON Schema

```json
{
  "startNodeId": "greeting",
  "nodes": [
    {
      "id": "greeting",
      "description": "Greet the user",
      "prompt": "Say hello...",
      "edges": [
        {
          "id": "edge-1",
          "to_node_id": "collect_info",
          "condition": "user wants help"
        }
      ]
    }
  ]
}
```

## Project Structure

```
src/
├── components/
│   ├── Canvas.tsx         – React Flow canvas wrapper
│   ├── CustomNode.tsx     – Custom node with start badge & error states
│   ├── CustomEdge.tsx     – Edge with condition label & delete button
│   ├── NodeSidebar.tsx    – Property editor panel
│   ├── JsonPreview.tsx    – Live JSON with syntax highlighting
│   └── Toolbar.tsx        – Top toolbar with actions
├── store/
│   ├── store.ts           – Redux store config & typed hooks
│   └── flowSlice.ts       – All state, actions, and revalidation
├── utils/
│   ├── validation.ts      – Validation rules
│   └── jsonExport.ts      – Schema serialization & import
├── types.ts               – Shared TypeScript types
├── App.tsx                – Layout shell
├── index.css              – Design system & styles
└── main.tsx               – Entry point
```
