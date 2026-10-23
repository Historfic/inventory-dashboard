"use client";

import { Switch } from "@/components/ui/switch";

type Props = {
  hideUnassigned: boolean;
  onChange: (hide: boolean) => void;
};

export function UnassignedToggle({ hideUnassigned, onChange }: Props) {
  return (
    <label className="flex min-h-10 cursor-pointer items-center gap-2 text-sm sm:min-h-0">
      <Switch checked={hideUnassigned} onCheckedChange={onChange} />
      <span className="text-foreground">Hide UNASSIGNED</span>
    </label>
  );
}
