// Per §2.5-A: edit ONE node only. Pass the target node name as the only arg.
// Usage: node scripts/n8n-fix-parser-age.mjs "Metadata Parser2"
import { readFileSync } from "fs";

const env = readFileSync(".env.local", "utf8");
const token = env.match(/N8N_API_TOKEN=(.+)/)?.[1]?.trim();
const baseUrl = env.match(/N8N_BASE_URL=(.+)/)?.[1]?.trim();
if (!token || !baseUrl) {
  console.error("Missing N8N_API_TOKEN or N8N_BASE_URL in .env.local");
  process.exit(1);
}

const targetNodeName = process.argv[2];
if (!targetNodeName) {
  console.error("Usage: node n8n-fix-parser-age.mjs <NodeName>");
  process.exit(1);
}

const workflowId = "tLvIuvkmtztVT9JZ";
const OLD_VALUE = "MAX_AGE_DAYS = 7";
const NEW_VALUE = "MAX_AGE_DAYS = 35";

async function n8n(path, opts = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
    ...opts,
    headers: {
      "X-N8N-API-KEY": token,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...opts.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HTTP ${res.status} on ${opts.method ?? "GET"} ${path}: ${body}`);
  }
  return res.json();
}

console.log(`Step 1/4: reading workflow ${workflowId}...`);
const wf = await n8n(`/workflows/${workflowId}`);

const target = wf.nodes.find((n) => n.name === targetNodeName);
if (!target) {
  console.error(`Node "${targetNodeName}" not found.`);
  process.exit(1);
}
const code = target.parameters?.jsCode ?? "";
if (!code.includes(OLD_VALUE)) {
  console.error(`Node "${targetNodeName}" does not contain "${OLD_VALUE}". Aborting.`);
  console.error("Current code:", code.slice(0, 200));
  process.exit(1);
}

const newCode = code.replace(OLD_VALUE, NEW_VALUE);
if (!newCode.includes(NEW_VALUE) || newCode === code) {
  console.error("Replacement failed. Aborting before any write.");
  process.exit(1);
}
console.log(`Step 2/4: replacement prepared (${OLD_VALUE} → ${NEW_VALUE}).`);

// Build the PUT body. n8n's PUT /workflows/{id} requires: name, nodes, connections, settings.
// The public API's settings schema only accepts a small allowlist of keys; internal-only fields
// (timeSavedMode, callerPolicy, availableInMCP, etc.) cause "must NOT have additional properties".
const SETTINGS_ALLOWED = new Set([
  "saveExecutionProgress",
  "saveManualExecutions",
  "saveDataErrorExecution",
  "saveDataSuccessExecution",
  "executionTimeout",
  "errorWorkflow",
  "timezone",
  "executionOrder",
]);
const filteredSettings = Object.fromEntries(
  Object.entries(wf.settings ?? {}).filter(([k]) => SETTINGS_ALLOWED.has(k))
);

const updatedNodes = wf.nodes.map((n) =>
  n.name === targetNodeName
    ? { ...n, parameters: { ...n.parameters, jsCode: newCode } }
    : n
);
const body = {
  name: wf.name,
  nodes: updatedNodes,
  connections: wf.connections,
  settings: filteredSettings,
};

console.log(`Step 3/4: PUT workflow with modified ${targetNodeName} ...`);
await n8n(`/workflows/${workflowId}`, { method: "PUT", body: JSON.stringify(body) });

console.log(`Step 4/4: re-reading workflow to verify ...`);
const after = await n8n(`/workflows/${workflowId}`);
const verifyNode = after.nodes.find((n) => n.name === targetNodeName);
const verifyCode = verifyNode?.parameters?.jsCode ?? "";
if (verifyCode.includes(NEW_VALUE) && !verifyCode.includes(OLD_VALUE)) {
  console.log("✅ Verified: node now contains", NEW_VALUE);
} else {
  console.error("❌ Verification failed.");
  console.error("Code excerpt:", verifyCode.slice(0, 200));
  process.exit(1);
}
