import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { SEO } from "@/components/seo";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, Mail, GraduationCap } from "lucide-react";

export default function AcademyVerify() {
  const [, navigate] = useLocation();
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) { setState("error"); setMessage("Lien de validation invalide."); return; }
    (async () => {
      try {
        const res = await fetch("/api/academy/verify", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        setState("ok"); setMessage(data.message);
      } catch (e: any) { setState("error"); setMessage(e.message); }
    })();
  }, []);

  return (
    <div className="max-w-md mx-auto px-6 py-20 text-center">
      <SEO title="Vérification email — DataMEAL Academy" description="Validation de votre adresse email." />
      {state === "loading" && (<><Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" /><p className="text-muted-foreground">Vérification en cours…</p></>)}
      {state === "ok" && (<>
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5"><CheckCircle2 className="w-8 h-8 text-primary" /></div>
        <h1 className="text-2xl font-bold mb-2">Email vérifié ! 🎉</h1>
        <p className="text-muted-foreground mb-6">Votre compte est maintenant activé. Prochaine étape : passer le test d'aptitude pour débloquer vos cours.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={() => navigate("/elearning")} className="gap-2"><GraduationCap className="w-4 h-4" /> Passer le test</Button>
          <Button variant="outline" onClick={() => navigate("/academy/dashboard")}>Mon espace</Button>
        </div>
      </>)}
      {state === "error" && (<>
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-5"><XCircle className="w-8 h-8 text-destructive" /></div>
        <h1 className="text-2xl font-bold mb-2">Validation échouée</h1>
        <p className="text-muted-foreground mb-6">{message}</p>
        <Button variant="outline" onClick={() => navigate("/academy/login")}>Se connecter</Button>
      </>)}
    </div>
  );
}
