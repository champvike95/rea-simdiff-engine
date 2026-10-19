import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function runTests() {
  console.log("🚀 Spawning MCP Server...");

  const transport = new StdioClientTransport({
    command: "node",
    args: ["mcp-server.js"]
  });

  const client = new Client(
    { name: "test-client", version: "1.0.0" },
    { capabilities: {} }
  );

  await client.connect(transport);
  console.log("✅ Connected to MCP Server over Stdio.\n");

  const toolsList = await client.listTools();
  console.log("📋 Available Tools:");
  toolsList.tools.forEach((t) => console.log(`  - ${t.name}: ${t.description}`));
  console.log("\n" + "─".repeat(50) + "\n");

  console.log("🔍 Testing Tool: inspect_structure on test_scripts/v1.py ...");
  const inspectResult = await client.callTool({
    name: "inspect_structure",
    arguments: { filePath: "test_scripts/v1.py" }
  });
  console.log("Result:\n", inspectResult.content[0].text);
  console.log("─".repeat(50) + "\n");

  console.log("⚡ Testing Tool: diff_scripts comparing v1.py and v2.py ...");
  const diffResult = await client.callTool({
    name: "diff_scripts",
    arguments: {
      fileA: "test_scripts/v1.py",
      fileB: "test_scripts/v2.py"
    }
  });
  console.log("Result:\n", diffResult.content[0].text);

  await transport.close();
  console.log("\n✨ All tests executed successfully!");
}

runTests().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
