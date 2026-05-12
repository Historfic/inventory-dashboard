import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function TestPage() {
  const { data, error, count } = await supabase
    .from("latest_inventory_snapshot")
    .select("*", { count: "exact" })
    .range(0, 9999);

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 p-8">
        <h1 className="text-2xl font-semibold mb-4">Supabase connection test</h1>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-red-200">
          <h2 className="text-red-700 font-medium mb-2">Query error</h2>
          <pre className="text-sm whitespace-pre-wrap text-red-900">
            {JSON.stringify(error, null, 2)}
          </pre>
        </div>
      </main>
    );
  }

  const rows = data ?? [];
  const firstFive = rows.slice(0, 5);
  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-semibold mb-2">Supabase connection test</h1>
      <p className="text-sm text-gray-600 mb-6">
        Querying <code className="bg-gray-200 px-1 rounded">latest_inventory_snapshot</code> with{" "}
        <code className="bg-gray-200 px-1 rounded">.range(0, 9999)</code>
      </p>

      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <h2 className="font-medium mb-2">Summary</h2>
        <ul className="text-sm space-y-1">
          <li>Rows returned: <strong>{rows.length}</strong></li>
          <li>Server-reported count: <strong>{count ?? "n/a"}</strong></li>
          <li>Columns detected: <strong>{columns.length}</strong></li>
        </ul>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <h2 className="font-medium mb-2">Columns</h2>
        <pre className="text-xs whitespace-pre-wrap bg-gray-100 p-3 rounded">
          {JSON.stringify(columns, null, 2)}
        </pre>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="font-medium mb-2">First 5 rows (raw JSON)</h2>
        <pre className="text-xs whitespace-pre-wrap bg-gray-100 p-3 rounded overflow-x-auto">
          {JSON.stringify(firstFive, null, 2)}
        </pre>
      </div>
    </main>
  );
}
