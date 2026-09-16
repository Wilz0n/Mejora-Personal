import { getUserId } from "@/lib/db/session";
import { getUserProfile } from "@/lib/db/data";
import { Sidebar } from "@/components/comun/layout/Sidebar";
import { Topbar } from "@/components/comun/layout/Topbar";
import { PageScope } from "@/components/comun/layout/PageScope";
import { FaviconSetter } from "@/components/comun/FaviconSetter";
import { QuickCssStyle } from "@/components/comun/QuickCssStyle";
import { SidebarCollapseProvider } from "@/components/animacion/SidebarCollapseContext";
import { MainContent } from "@/components/animacion/MainContent";
import { SidebarReopenButton } from "@/components/animacion/SidebarReopenButton";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fuerza sesión activa; redirige a /login si no hay usuario.
  const userId = await getUserId();
  const profile = await getUserProfile(userId);

  return (
    <SidebarCollapseProvider>
      {/* Tema personalizado (QuickCSS) desde la BD: se aplica en todos los
          dispositivos, sin FOUC (server-side). */}
      <QuickCssStyle quickCss={profile.quickCss} />
      {/* Favicon dinámico: usa el icono personalizado del usuario si existe. */}
      <FaviconSetter appIcon={profile.appIcon} />
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar appIcon={profile.appIcon} />
        {/* Botón flotante (Desktop) para reabrir la barra cuando está colapsada. */}
        <SidebarReopenButton appIcon={profile.appIcon} />
        <MainContent>
          <Topbar avatar={profile.image} />
          <div className="p-gutter max-w-container-max mx-auto w-full min-w-0 overflow-x-hidden pb-24 md:pb-12">
            <PageScope>{children}</PageScope>
          </div>
        </MainContent>
      </div>
    </SidebarCollapseProvider>
  );
}
