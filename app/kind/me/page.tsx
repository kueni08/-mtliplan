import { auth } from "@/auth";
import { redirect } from "next/navigation";

// Redirect shortcut: /kind/me → /kind/[memberId] for the logged-in child/adult session
export default async function KindMePage() {
  const session = await auth();
  if (!session) redirect("/");
  if (session.role === "pending") redirect("/pending");
  if ((session.role === "child" || session.role === "adult") && session.memberId) {
    redirect(`/kind/${session.memberId}`);
  }
  redirect("/dashboard");
}
