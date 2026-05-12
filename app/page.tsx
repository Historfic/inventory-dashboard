"use client";

import { GranularItemsTable } from "@/components/GranularItemsTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useInventoryData } from "@/hooks/useInventoryData";

export default function DashboardPage() {
  const { data, loading, error } = useInventoryData();

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Inventory Dashboard</h1>
      </header>

      <Card className="bg-white shadow-sm rounded-lg">
        <CardHeader>
          <CardTitle>Purchase Days Out</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-sm text-gray-500">Loading...</div>
          ) : error ? (
            <div className="py-12 text-center text-sm text-red-700">
              Error loading data: {error}
            </div>
          ) : (
            <GranularItemsTable data={data ?? []} />
          )}
        </CardContent>
      </Card>
    </main>
  );
}
