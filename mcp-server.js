import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { execSync } from "child_process";
import { diff } from "deep-object-diff";

const server = new Server(
  { name: "rea-simdiff-engine", version: "2.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "inspect_structure",
      description: "Parses a Python script and returns its functions, classes, and imports.",
      inputSchema: {
        type: "object",
        properties: {
          filePath: { type: "string", description: "Path to a .py file" }
        },
        required: ["filePath"]
      }
    },
    {
      name: "diff_scripts",
      description: "Compares two Python scripts and reports added, removed, and modified functions/classes.",
      inputSchema: {
        type: "object",
        properties: {
          fileA: { type: "string", description: "Path to first .py file" },
          fileB: { type: "string", description: "Path to second .py file" }
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

  if (name === "diff_scripts") {
    const treeA = JSON.parse(execSync(`python3 engine.py "${args.fileA}"`).toString());
    const treeB = JSON.parse(execSync(`python3 engine.py "${args.fileB}"`).toString());

    const result = {
      functions: {
        added: Object.keys(treeB.functions).filter(k => !(k in treeA.functions)),
        removed: Object.keys(treeA.functions).filter(k => !(k in treeB.functions)),
        modified: diff(treeA.functions, treeB.functions)
      },
      classes: {
        added: Object.keys(treeB.classes).filter(k => !(k in treeA.classes)),
        removed: Object.keys(treeA.classes).filter(k => !(k in treeB.classes)),
        modified: diff(treeA.classes, treeB.classes)
      },
      imports: {
        added: treeB.imports.filter(i => !treeA.imports.some(j => j.module === i.module)),
        removed: treeA.imports.filter(i => !treeB.imports.some(j => j.module === i.module))
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
