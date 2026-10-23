"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Days Out" },
  { href: "/gmroi", label: "Turns" },
  { href: "/line-counts", label: "Line Counts" },
  { href: "/freight", label: "Inbound Freight" },
  { href: "/arbitrage", label: "Arbitrage" },
];

const focusRing =
  "rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export function Navigation() {
  const pathname = usePathname();
  return (
    <nav className="border-b border-border bg-card">
      <div className="flex h-16 items-center gap-10 px-8">
        <Link href="/" aria-label="Home" className={focusRing}>
          <Image
            src="/PSLogo-dark.svg"
            alt="Plumbing Supply"
            width={220}
            height={40}
            priority
          />
        </Link>
        <div className="flex h-full items-stretch gap-6">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative inline-flex items-center text-sm font-medium transition-colors",
                  focusRing,
                  "focus-visible:ring-inset focus-visible:ring-offset-0",
                  active
                    ? "text-primary after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full after:bg-brand"
                    : "text-muted-foreground hover:text-foreground"
                )}
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
