import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { execSync } from "child_process";
import { diff } from "deep-object-diff";

const server = new Server(
  { name: "rea-simdiff-engine", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "inspect_structure",
      description: "Parses a model/binary file into a structured block diagram tree.",
      inputSchema: {
        type: "object",
        properties: {
          filePath: { type: "string", description: "Path to .slx or XML file" }
        },
        required: ["filePath"]
      }
    },
    {
      name: "diff_models",
      description: "Computes structural differences between two model files (adds, removals, property edits).",
      inputSchema: {
        type: "object",
        properties: {
          fileA: { type: "string" },
          fileB: { type: "string" }
        },
        required: ["fileA", "fileB"]
      }
    }
  ]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "inspect_structure") {
    const output = execSync(`python3 engine.py "${args.filePath}"`).toString();
    return { content: [{ type: "text", text: output }] };
  }

  if (name === "diff_models") {
    const treeA_str = execSync(`python3 engine.py "${args.fileA}"`).toString();
    const treeB_str = execSync(`python3 engine.py "${args.fileB}"`).toString();

    const treeA = JSON.parse(treeA_str);
    const treeB = JSON.parse(treeB_str);

    const differences = diff(treeA, treeB);

    const added = Object.keys(treeB).filter(k => !(k in treeA));
    const removed = Object.keys(treeA).filter(k => !(k in treeB));

    const result = {
      summary: {
        added_blocks: added,
        removed_blocks: removed,
        modified_properties: differences
      }
    };

    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }

  throw new Error(`Tool ${name} not found.`);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main();
