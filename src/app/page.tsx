import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function Home() {
  const userId = await getSession();
  if (userId) redirect("/dashboard");
  redirect("/login");
}
