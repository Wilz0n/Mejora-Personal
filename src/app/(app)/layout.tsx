import { getUserId } from "@/lib/session";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fuerza sesión activa; redirige a /login si no hay usuario.
  await getUserId();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 flex flex-col md:ml-60 h-screen overflow-y-auto bg-background no-scrollbar">
        <Topbar />
        <div className="p-gutter max-w-container-max mx-auto w-full pb-24 md:pb-12">
          {children}
        </div>
      </main>
    </div>
  );
}
