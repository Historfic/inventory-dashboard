import type { ReactNode } from "react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Props = {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

/**
 * The one card style for every dashboard section: white, hairline ring, soft shadow (CLAUDE.md §5).
 * Phones: the header `action` drops under the title instead of squeezing it; from sm up it sits top-right.
 */
export function DashboardCard({ title, description, action, children, className }: Props) {
  return (
    <Card className={cn("min-w-0 shadow-sm", className)}>
      <CardHeader className="has-data-[slot=card-action]:grid-cols-1 sm:has-data-[slot=card-action]:grid-cols-[1fr_auto]">
        <CardTitle className="text-base font-semibold text-foreground">{title}</CardTitle>
        {description && <CardDescription className="text-xs">{description}</CardDescription>}
        {action && (
          <CardAction className="col-start-1 row-span-1 row-start-auto mt-1 justify-self-start sm:col-start-2 sm:row-span-2 sm:row-start-1 sm:mt-0 sm:justify-self-end">
            {action}
          </CardAction>
        )}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
