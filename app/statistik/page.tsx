import { auth } from "@/auth";
import { redirect } from "next/navigation";
import StatistikClient from "./StatistikClient";

export default async function StatistikPage() {
  const session = await auth();
  if (!session) redirect("/");
  if (session.role === "pending") redirect("/pending");
  return <StatistikClient />;
}
