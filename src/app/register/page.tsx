import { redirect } from "next/navigation";
import { getUserIdOrNull } from "@/lib/session";
import { RegisterForm } from "@/components/RegisterForm";
import { Icon } from "@/components/Icon";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  if (await getUserIdOrNull()) redirect("/");

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-3">
            <Icon name="eco" className="text-primary text-[28px]" filled />
          </div>
          <h1 className="text-headline-lg font-headline-lg text-primary">
            Crea tu cuenta
          </h1>
          <p className="text-body-sm text-on-surface-variant">
            Empieza a construir mejores hábitos
          </p>
        </div>
        <div className="glass-panel rounded-2xl p-6">
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
