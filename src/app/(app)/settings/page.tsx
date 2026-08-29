import { getUserId } from "@/lib/session";
import { getUserProfile, getFinanceData } from "@/lib/data";
import { Icon } from "@/components/comun/Icon";
import { EditProfileButton } from "@/components/settings/EditProfileButton";
import { LogoutButton } from "@/components/settings/LogoutButton";
import { CurrencySelect } from "@/components/settings/CurrencySelect";
import { TimezoneSelect } from "@/components/settings/TimezoneSelect";
import { PurgeDataButton } from "@/components/settings/PurgeDataButton";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const userId = await getUserId();
  const [profile, finance] = await Promise.all([
    getUserProfile(userId),
    getFinanceData(userId),
  ]);
  const timezone = profile.timezone;

  return (
    <div className="max-w-container-max mx-auto">
      {/* Header */}
      <header className="mb-stack-lg">
        <h2 className="text-display font-display text-on-surface">
          Ajustes y Perfil
        </h2>
        <p className="text-body-lg font-body-lg text-on-surface-variant mt-2">
          Gestiona tu identidad, preferencias y datos.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-stack-md">
        {/* Identidad */}
        <section className="lg:col-span-4 glass-panel rounded-xl p-stack-md flex flex-col relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
          <h3 className="text-headline-md font-headline-md text-on-surface mb-stack-md border-b border-surface-variant pb-2">
            Identidad
          </h3>
          <div className="flex flex-col items-center mt-stack-sm mb-stack-md">
            <div className="relative mb-4">
              {profile.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt="Avatar"
                  src={profile.image}
                  className="w-24 h-24 rounded-full object-cover border-2 border-surface-variant"
                />
              ) : (
                <div className="w-24 h-24 rounded-full border-2 border-surface-variant bg-primary-container flex items-center justify-center text-on-primary-container">
                  <Icon name="person" className="text-[44px]" filled />
                </div>
              )}
            </div>
            <h4 className="text-headline-lg font-headline-lg text-on-surface">
              {profile.name}
            </h4>
            <p className="text-body-md font-body-md text-on-surface-variant">
              {profile.email || "—"}
            </p>
          </div>
          <div className="mt-auto pt-stack-sm">
            <EditProfileButton name={profile.name} image={profile.image} />
          </div>

          {/* Cerrar sesión (justo debajo de Editar Perfil) */}
          <div className="pt-stack-sm mt-stack-sm border-t border-surface-variant">
            <LogoutButton />
          </div>
        </section>

        {/* Preferencias */}
        <section className="lg:col-span-8 glass-panel rounded-xl p-stack-md flex flex-col">
          <h3 className="text-headline-md font-headline-md text-on-surface mb-stack-md border-b border-surface-variant pb-2">
            Preferencias de la Aplicación
          </h3>
          <div className="flex flex-col gap-stack-md mt-stack-sm">
            {/* Moneda */}
            <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-lg border border-surface-variant">
              <div>
                <h4 className="text-body-lg font-body-lg text-on-surface font-medium">
                  Moneda por Defecto
                </h4>
                <p className="text-body-sm font-body-sm text-on-surface-variant">
                  Se usa en las métricas de Finanzas.
                </p>
              </div>
              <CurrencySelect current={finance.currency} />
            </div>

            {/* Zona Horaria */}
            <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-lg border border-surface-variant">
              <div>
                <h4 className="text-body-lg font-body-lg text-on-surface font-medium">
                  Zona Horaria
                </h4>
                <p className="text-body-sm font-body-sm text-on-surface-variant">
                  Define qué día es &quot;hoy&quot; en tus hábitos.
                </p>
              </div>
              <TimezoneSelect current={timezone} />
            </div>

            {/* Tema (placeholder: app dark-only) */}
            <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-lg border border-surface-variant">
              <div>
                <h4 className="text-body-lg font-body-lg text-on-surface font-medium">
                  Tema de la Interfaz
                </h4>
                <p className="text-body-sm font-body-sm text-on-surface-variant">
                  Modo oscuro para un enfoque óptimo.
                </p>
              </div>
              <div className="flex bg-background border border-outline-variant rounded-lg p-1">
                <button
                  disabled
                  className="px-3 py-1 rounded-md text-on-surface-variant font-label-caps text-label-caps flex items-center gap-1 opacity-50 cursor-not-allowed"
                >
                  <Icon name="light_mode" className="text-[16px]" />
                  Claro
                </button>
                <button className="px-3 py-1 rounded-md bg-surface-variant text-primary font-label-caps text-label-caps flex items-center gap-1 shadow-sm border border-outline-variant">
                  <Icon name="dark_mode" className="text-[16px]" filled />
                  Oscuro
                </button>
              </div>
            </div>

            {/* Persistencia */}
            <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-lg border border-surface-variant">
              <div>
                <h4 className="text-body-lg font-body-lg text-on-surface font-medium">
                  Persistencia de Datos
                </h4>
                <p className="text-body-sm font-body-sm text-on-surface-variant">
                  Estado de sincronización en la nube.
                </p>
              </div>
              <div className="flex items-center gap-2 bg-background px-3 py-1.5 rounded-full border border-surface-variant">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-label-caps font-label-caps text-on-surface">
                  Neon Connected
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Gestión de datos */}
        <section className="lg:col-span-12 glass-panel rounded-xl p-stack-md flex flex-col relative overflow-hidden">
          <h3 className="text-headline-md font-headline-md text-on-surface mb-stack-sm">
            Gestión de Datos
          </h3>
          <p className="text-body-md font-body-md text-on-surface-variant mb-stack-md">
            Descarga un archivo con tus hábitos, registros financieros y
            proyectos. Tus datos te pertenecen.
          </p>
          <div className="flex flex-wrap gap-4 mt-2 items-center">
            <a
              href="/api/export?format=json"
              className="bg-surface-variant hover:bg-surface-container-high border border-outline-variant text-on-surface font-body-md px-6 py-3 rounded-lg transition-colors flex items-center gap-2 group"
            >
              <Icon
                name="data_object"
                className="text-tertiary group-hover:scale-110 transition-transform"
              />
              Exportar como JSON
            </a>
            <a
              href="/api/export?format=csv"
              className="bg-surface-variant hover:bg-surface-container-high border border-outline-variant text-on-surface font-body-md px-6 py-3 rounded-lg transition-colors flex items-center gap-2 group"
            >
              <Icon
                name="table_chart"
                className="text-secondary group-hover:scale-110 transition-transform"
              />
              Exportar como CSV
            </a>
            <div className="ml-auto">
              <PurgeDataButton />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
