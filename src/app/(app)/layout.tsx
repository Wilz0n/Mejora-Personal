import { getUserId } from "@/lib/session";
import { getUserProfile } from "@/lib/data";
import { Sidebar } from "@/components/comun/Sidebar";
import { Topbar } from "@/components/comun/Topbar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fuerza sesión activa; redirige a /login si no hay usuario.
  const userId = await getUserId();
  const profile = await getUserProfile(userId);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 flex flex-col md:ml-60 h-screen overflow-y-auto bg-background no-scrollbar">
        <Topbar avatar={profile.image} />
        <div className="p-gutter max-w-container-max mx-auto w-full min-w-0 overflow-x-hidden pb-24 md:pb-12">
          {children}
        </div>
      </main>
    </div>
  );
}
