import { auth } from "@/auth";
import { redirect } from "next/navigation";

// Redirect shortcut: /kind/me → /kind/[childId] for the logged-in child session
export default async function KindMePage() {
  const session = await auth();
  if (!session) redirect("/");
  if (session.role === "child" && session.childId) {
    redirect(`/kind/${session.childId}`);
  }
  // Admin visiting /kind/me → go to dashboard
  redirect("/dashboard");
}
