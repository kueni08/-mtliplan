import { auth } from "@/auth";
import { redirect } from "next/navigation";
import EinstellungenClient from "./EinstellungenClient";

export default async function EinstellungenPage() {
  const session = await auth();
  if (!session) redirect("/");
  const needsSetup = !process.env.HOUSEHOLD_REFRESH_TOKEN;
  const adminRefreshToken = needsSetup ? (session.refreshToken ?? null) : null;
  return <EinstellungenClient needsSetup={needsSetup} adminRefreshToken={adminRefreshToken} />;
}
