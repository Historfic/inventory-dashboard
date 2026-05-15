"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Days Out" },
  { href: "/gmroi", label: "Turns" },
  { href: "/line-counts", label: "Line Counts" },
  { href: "/freight", label: "Inbound Freight" },
];

export function Navigation() {
  const pathname = usePathname();
  return (
    <nav className="border-b border-gray-200 bg-white px-6 py-3 shadow-sm">
      <div className="flex items-center gap-8">
        <Link href="/" aria-label="Home">
          <Image
            src="/PSLogo-dark.svg"
            alt="Plumbing Supply"
            width={220}
            height={40}
            priority
          />
        </Link>
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
