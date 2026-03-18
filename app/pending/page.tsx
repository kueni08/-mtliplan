import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";

export default async function PendingPage() {
  const session = await auth();
  if (!session) redirect("/");
  if (session.role !== "pending") redirect("/dashboard");

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="text-6xl">⏳</div>
        <h1 className="text-2xl font-bold text-white">Kein Zugang</h1>
        <div className="glass rounded-3xl p-6 space-y-4">
          <p className="text-white/70 text-sm">
            Dein Google-Konto{" "}
            <span className="text-purple-300 font-medium">{session.user?.email}</span>{" "}
            ist noch keinem Haushaltsmitglied zugeordnet.
          </p>
          <p className="text-white/50 text-xs">
            Bitte den Admin, deine E-Mail-Adresse in den Einstellungen
            beim richtigen Mitglied einzutragen. Danach einmal ab- und wieder anmelden.
          </p>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-3 px-6 rounded-2xl transition-all"
          >
            Abmelden
          </button>
        </form>
      </div>
    </main>
  );
}
