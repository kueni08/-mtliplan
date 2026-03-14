import { auth } from "@/auth";
import { redirect } from "next/navigation";
import KindClient from "./KindClient";

interface PageProps {
  params: { id: string };
}

export default async function KindPage({ params }: PageProps) {
  const session = await auth();
  if (!session) redirect("/");

  return <KindClient childId={params.id} />;
}
