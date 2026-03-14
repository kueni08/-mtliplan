import { auth } from "@/auth";
import { redirect } from "next/navigation";
import EinstellungenClient from "./EinstellungenClient";

export default async function EinstellungenPage() {
  const session = await auth();
  if (!session) redirect("/");
  return <EinstellungenClient />;
}
