import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminFetch } from "@/lib/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Video, Plus, Loader2, Calendar, Clock, Radio, Users, Trash2, X,
  Play, Square, Copy, ExternalLink, CheckCircle2,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

export default function AdminMeetings() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", kind: "meeting", starts_at: "", duration_min: 60 });

  const { data: meetings, isLoading } = useQuery<any[]>({
    queryKey: ["admin-meetings"],
    queryFn: async () => (await adminFetch("/api/admin/academy/meetings")).json(),
  });

  const create = useMutation({
    mutationFn: async () => adminFetch("/api/admin/academy/meetings", { method: "POST", body: JSON.stringify(form) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-meetings"] });
      toast({ title: "Rencontre planifiée", description: "Les étudiants admis ont été notifiés." });
      setShowForm(false);
      setForm({ title: "", description: "", kind: "meeting", starts_at: "", duration_min: 60 });
    },
    onError: () => toast({ title: "Erreur", variant: "destructive" }),
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) =>
      adminFetch(`/api/admin/academy/meetings/${id}`, { method: "PUT", body: JSON.stringify({ status }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-meetings"] }); },
  });

  const remove = useMutation({
    mutationFn: async (id: number) => adminFetch(`/api/admin/academy/meetings/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-meetings"] }); toast({ title: "Supprimée" }); },
  });

  if (isLoading) return <div className="flex justify-center py-32"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const now = Date.now();
  const upcoming = (meetings || []).filter(m => new Date(m.starts_at).getTime() > now - 6 * 3600e3 && m.status !== "ended" && m.status !== "cancelled");
  const past = (meetings || []).filter(m => !upcoming.includes(m));

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Video className="w-6 h-6 text-primary" /> Rencontres en ligne</h1>
          <p className="text-muted-foreground text-sm mt-1">Planifiez webinaires et réunions interactives pour vos étudiants</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2"><Plus className="w-4 h-4" /> Planifier</Button>
      </div>

      {upcoming.length > 0 && <h2 className="text-sm font-semibold text-muted-foreground">À venir</h2>}
      <div className="grid gap-3">
        {upcoming.map(m => <MeetingCard key={m.id} m={m} onStatus={(s) => setStatus.mutate({ id: m.id, status: s })} onDelete={() => { if (confirm("Supprimer cette rencontre ?")) remove.mutate(m.id); }} toast={toast} />)}
        {upcoming.length === 0 && (
          <div className="bg-card rounded-2xl border border-dashed border-border/60 p-10 text-center">
            <Video className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Aucune rencontre planifiée. Cliquez « Planifier » pour en créer une.</p>
          </div>
        )}
      </div>

      {past.length > 0 && (
        <>
          <h2 className="text-sm font-semibold text-muted-foreground pt-4">Passées / terminées</h2>
          <div className="grid gap-3">
            {past.map(m => <MeetingCard key={m.id} m={m} onStatus={(s) => setStatus.mutate({ id: m.id, status: s })} onDelete={() => { if (confirm("Supprimer ?")) remove.mutate(m.id); }} toast={toast} past />)}
          </div>
        </>
      )}

      {/* Modal création */}
      {showForm && (
        <>
          <div className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg bg-background rounded-3xl border border-border/50 shadow-2xl p-6" style={{ animation: "popIn .25s cubic-bezier(.16,1,.3,1)" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-lg">Planifier une rencontre</h2>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Titre *</label>
                <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Ex : Session live — Introduction à KoboCollect" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" placeholder="Au programme…" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setForm({ ...form, kind: "meeting" })}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-sm text-left ${form.kind === "meeting" ? "border-primary bg-primary/5" : "border-border"}`}>
                    <Users className="w-4 h-4 text-primary" /><div><p className="font-medium">Interactive</p><p className="text-xs text-muted-foreground">Tous parlent</p></div>
                  </button>
                  <button onClick={() => setForm({ ...form, kind: "webinar" })}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-sm text-left ${form.kind === "webinar" ? "border-primary bg-primary/5" : "border-border"}`}>
                    <Radio className="w-4 h-4 text-primary" /><div><p className="font-medium">Webinaire</p><p className="text-xs text-muted-foreground">Vous présentez</p></div>
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Date & heure *</label>
                  <Input type="datetime-local" value={form.starts_at} onChange={e => setForm({ ...form, starts_at: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Durée (min)</label>
                  <Input type="number" value={form.duration_min} onChange={e => setForm({ ...form, duration_min: Number(e.target.value) })} />
                </div>
              </div>
              <Button onClick={() => create.mutate()} disabled={!form.title || !form.starts_at || create.isPending} className="w-full gap-2">
                {create.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Planifier & notifier les étudiants
              </Button>
            </div>
          </div>
        </>
      )}
      <style>{`@keyframes popIn { from { opacity:0; transform:translate(-50%,-48%) scale(.96); } to { opacity:1; transform:translate(-50%,-50%) scale(1); } }`}</style>
    </div>
  );
}

function MeetingCard({ m, onStatus, onDelete, toast, past }: any) {
  const start = new Date(m.starts_at);
  const isWebinar = m.kind === "webinar";
  const joinUrl = `${window.location.origin}/academy/live/${m.id}`;
  const isLive = m.status === "live";
  return (
    <div className={`bg-card rounded-2xl border p-4 flex items-center gap-4 ${isLive ? "border-primary/50 ring-1 ring-primary/20" : "border-border/50"} ${past ? "opacity-70" : ""}`}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${isWebinar ? "bg-purple-500/10 text-purple-600" : "bg-primary/10 text-primary"}`}>
        {isWebinar ? <Radio className="w-5 h-5" /> : <Users className="w-5 h-5" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm truncate">{m.title}</p>
          {isLive && <span className="text-[10px] font-bold text-white bg-red-500 px-1.5 py-0.5 rounded animate-pulse">● LIVE</span>}
        </div>
        <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
          <Calendar className="w-3 h-3" /> {format(start, "d MMM yyyy 'à' HH:mm", { locale: fr })} · {m.duration_min} min
        </p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Copier le lien" onClick={() => { navigator.clipboard.writeText(joinUrl); toast({ title: "Lien copié" }); }}><Copy className="w-3.5 h-3.5" /></Button>
        <a href={joinUrl} target="_blank" rel="noopener noreferrer"><Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Ouvrir"><ExternalLink className="w-3.5 h-3.5" /></Button></a>
        {!past && (isLive
          ? <Button size="sm" variant="outline" className="gap-1.5 h-8" onClick={() => onStatus("ended")}><Square className="w-3.5 h-3.5" /> Terminer</Button>
          : <Button size="sm" className="gap-1.5 h-8" onClick={() => onStatus("live")}><Play className="w-3.5 h-3.5" /> Démarrer</Button>)}
        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive" onClick={onDelete}><Trash2 className="w-3.5 h-3.5" /></Button>
      </div>
    </div>
  );
}
