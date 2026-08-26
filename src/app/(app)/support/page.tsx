import { Icon } from "@/components/comun/Icon";

export const dynamic = "force-dynamic";

export default function SupportPage() {
  return (
    <div className="flex flex-col items-center justify-center text-center min-h-[60vh] gap-6">
      <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
        <Icon name="help" className="text-primary text-[44px]" filled />
      </div>
      <div className="space-y-2">
        <h2 className="text-headline-lg font-headline-lg text-on-surface">
          En construcción
        </h2>
        <p className="text-body-md font-body-md text-on-surface-variant max-w-md">
          La sección de soporte estará disponible pronto.
        </p>
      </div>
    </div>
  );
}
