"use client";

import { useEffect, useRef } from "react";
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

/**
 * Centre a tab in the phone tab strip by moving only the strip's own scrollLeft (never the page,
 * no smooth scroll). The strip is `relative`, so it is the tab's offsetParent and offsetLeft is
 * measured from it. From md up the strip doesn't scroll, so this does nothing there.
 */
function centerInStrip(el: HTMLElement) {
  const strip = el.parentElement;
  if (!strip) return;
  strip.scrollLeft = el.offsetLeft - (strip.clientWidth - el.offsetWidth) / 2;
}

/**
 * Phones: logo on its own row, tabs in a sideways-scrolling strip under it, spaced so the
 * next tab peeks in at the right edge (a hint that the strip scrolls).
 * From md up: one 64px bar, logo then tabs (each tab's px-2 is taken back from the gaps,
 * so labels and the active underline sit exactly where they did before the padding).
 */
export function Navigation() {
  const pathname = usePathname();
  const stripRef = useRef<HTMLDivElement>(null);

  // On a phone the current tab can sit past the right edge of the strip: scroll it into view.
  useEffect(() => {
    const active = stripRef.current?.querySelector<HTMLElement>('[aria-current="page"]');
    if (active) centerInStrip(active);
  }, [pathname]);

  return (
    <nav className="border-b border-border bg-card">
      <div className="flex flex-col md:h-16 md:flex-row md:items-center md:gap-8 md:px-8">
        <Link href="/" aria-label="Home" className={cn(focusRing, "mx-4 mt-1 self-start py-2 md:m-0 md:self-auto md:py-0")}>
          <Image
            src="/PSLogo-dark.svg"
            alt="Plumbing Supply"
            width={220}
            height={40}
            priority
            className="h-auto w-[150px] md:w-[220px]"
          />
        </Link>
        {/* `relative` makes the strip the tabs' offsetParent, so centerInStrip's offsetLeft is measured from it. */}
        <div
          ref={stripRef}
          className="relative flex h-11 items-stretch gap-1 overflow-x-auto px-2.5 [scrollbar-width:none] md:h-full md:gap-2 md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden"
        >
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                // Chrome won't scroll a partly visible tab on focus (and the strip has no scrollbar).
                onFocus={(e) => centerInStrip(e.currentTarget)}
                className={cn(
                  "relative inline-flex shrink-0 items-center px-1.5 text-sm font-medium whitespace-nowrap transition-colors md:px-2",
                  focusRing,
                  "focus-visible:ring-inset focus-visible:ring-offset-0",
                  active
                    ? "text-primary after:absolute after:inset-x-1.5 after:bottom-0 after:h-0.5 after:rounded-full after:bg-brand md:after:inset-x-2"
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
