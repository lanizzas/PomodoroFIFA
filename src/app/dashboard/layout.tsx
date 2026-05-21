import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import NavBar from "@/components/NavBar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">{children}</main>
    </div>
  );
}
