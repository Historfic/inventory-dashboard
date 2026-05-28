// READ-ONLY: fetches the workflow and lists Metadata Parser nodes.
// Does not modify anything. See n8n-edit-node.mjs for the write path.
import { readFileSync } from "fs";

const env = readFileSync(".env.local", "utf8");
const token = env.match(/N8N_API_TOKEN=(.+)/)?.[1]?.trim();
const baseUrl = env.match(/N8N_BASE_URL=(.+)/)?.[1]?.trim();
if (!token || !baseUrl) {
  console.error("Missing N8N_API_TOKEN or N8N_BASE_URL in .env.local");
  process.exit(1);
}

const workflowId = "tLvIuvkmtztVT9JZ";

const res = await fetch(`${baseUrl}/workflows/${workflowId}`, {
  headers: { "X-N8N-API-KEY": token, "Accept": "application/json" },
});
if (!res.ok) {
  console.error("HTTP", res.status, await res.text());
  process.exit(1);
}
const wf = await res.json();
console.log("Workflow name:", wf.name);
console.log("Total nodes:", wf.nodes.length);

const parserNodes = wf.nodes.filter((n) => /metadata parser/i.test(n.name));
console.log(`\nFound ${parserNodes.length} Metadata Parser node(s):\n`);
for (const n of parserNodes) {
  console.log("---");
  console.log("Name:", n.name);
  console.log("Type:", n.type);
  console.log("ID:", n.id);
  const code = n.parameters?.jsCode ?? n.parameters?.functionCode ?? "(no code field found)";
  // Look for the MAX_AGE_DAYS constant
  const match = code.match(/MAX_AGE_DAYS\s*=\s*(\d+)/);
  console.log("MAX_AGE_DAYS:", match ? match[1] : "(not found)");
  console.log("First 200 chars of code:", code.slice(0, 200).replace(/\n/g, " "));
}
