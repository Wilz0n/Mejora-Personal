"use client";

import { useState, useTransition } from "react";
import { setCurrency } from "@/app/actions/settings";
import { SUPPORTED_CURRENCIES } from "@/lib/finance-logic";
import { Icon } from "@/components/comun/Icon";

/** Selector de moneda por defecto, persistente vía Server Action. */
export function CurrencySelect({ current }: { current: string }) {
  const [value, setValue] = useState(current);
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    setValue(next);
    startTransition(async () => {
      await setCurrency({ currency: next });
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
        {SUPPORTED_CURRENCIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.label}
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
