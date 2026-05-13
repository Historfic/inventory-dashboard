"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Inventory" },
  { href: "/gmroi", label: "GMROI" },
];

export function Navigation() {
  const pathname = usePathname();
  return (
    <nav className="border-b border-gray-200 bg-white px-6 py-3">
      <div className="flex items-center gap-6">
        <span className="font-semibold text-gray-900">Inventory Dashboard</span>
        <div className="flex gap-1">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-gray-900 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
