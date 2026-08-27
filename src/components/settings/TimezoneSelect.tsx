"use client";

import { useState, useTransition } from "react";
import { setTimezone } from "@/app/actions/settings";
import { Icon } from "@/components/comun/Icon";

const TIMEZONE_OPTIONS = [
  { value: "America/Lima", label: "🇵🇪 Perú (Lima)" },
  { value: "America/New_York", label: "🇺🇸 Estados Unidos (Este)" },
];

/** Selector de zona horaria, persistente vía Server Action. */
export function TimezoneSelect({ current }: { current: string }) {
  const [value, setValue] = useState(current);
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    setValue(next);
    startTransition(async () => {
      await setTimezone({ timezone: next });
    });
  }

  return (
    <div className="relative">
      <select
        value={value}
        onChange={handleChange}
        disabled={isPending}
        className="appearance-none bg-background border border-outline-variant text-on-surface font-body-md py-2 pl-4 pr-10 rounded-md focus:border-primary focus:ring-1 focus:ring-primary/20 cursor-pointer outline-none transition-all disabled:opacity-60"
      >
        {TIMEZONE_OPTIONS.map((tz) => (
          <option key={tz.value} value={tz.value}>
            {tz.label}
          </option>
        ))}
      </select>
      <Icon
        name="expand_more"
        className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
      />
    </div>
  );
}
