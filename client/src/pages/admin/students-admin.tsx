import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminFetch } from "@/lib/admin";
import { Button } from "@/components/ui/button";
import {
  Users, GraduationCap, Award, BookOpen, Loader2, ChevronRight,
  X, Trophy, CheckCircle2, Clock, TrendingUp,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function AdminStudents() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { data: stats } = useQuery({
    queryKey: ["academy-stats"],
    queryFn: async () => (await adminFetch("/api/admin/academy/stats")).json(),
  });

  const { data: students, isLoading } = useQuery({
    queryKey: ["academy-students"],
    queryFn: async () => (await adminFetch("/api/admin/academy/students")).json(),
  });

  const { data: detail } = useQuery({
    queryKey: ["academy-student", selectedId],
    queryFn: async () => (await adminFetch(`/api/admin/academy/students/${selectedId}`)).json(),
    enabled: selectedId !== null,
  });

  const { data: attestations } = useQuery({
    queryKey: ["academy-attestations"],
    queryFn: async () => (await adminFetch("/api/admin/academy/attestations")).json(),
  });

  const issueAttestation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) =>
      adminFetch(`/api/admin/academy/attestations/${id}`, { method: "PUT", body: JSON.stringify({ status }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["academy-attestations"] }); toast({ title: "Attestation mise à jour" }); },
  });

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const studentGrades = detail?.grades || [];
  const chartData = studentGrades.map((g: any, i: number) => ({
    name: g.sms_courses?.code || `E${i + 1}`,
    pct: Math.round((Number(g.score) / Number(g.max_score)) * 100),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><GraduationCap className="w-6 h-6 text-primary" /> Gestion des étudiants</h1>
        <p className="text-muted-foreground text-sm mt-1">DataMEAL Academy — inscriptions, notes, attestations</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Étudiants", value: stats?.students ?? 0, icon: Users },
          { label: "Inscriptions", value: stats?.enrollments ?? 0, icon: BookOpen },
          { label: "Cours", value: stats?.courses ?? 0, icon: GraduationCap },
          { label: "Attestations en attente", value: stats?.pendingAttestations ?? 0, icon: Award },
        ].map(m => (
          <div key={m.label} className="bg-card rounded-2xl p-4 border border-border/50">
            <m.icon className="w-5 h-5 text-primary mb-2" />
            <div className="text-2xl font-bold">{m.value}</div>
            <div className="text-xs text-muted-foreground">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Attestations en attente */}
      {(attestations || []).filter((a: any) => a.status === "pending").length > 0 && (
        <div className="bg-card rounded-2xl border border-border/50 p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2"><Trophy className="w-5 h-5 text-amber-500" /> Demandes d'attestation</h2>
          <div className="space-y-2">
            {(attestations || []).filter((a: any) => a.status === "pending").map((a: any) => (
              <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/40">
                <div>
                  <p className="font-medium text-sm">{a.students?.full_name}</p>
                  <p className="text-xs text-muted-foreground">{a.sms_courses?.title} · Score {a.final_score}% · N° {a.certificate_no}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => issueAttestation.mutate({ id: a.id, status: "rejected" })}>Refuser</Button>
                  <Button size="sm" className="gap-1" onClick={() => issueAttestation.mutate({ id: a.id, status: "issued" })}><CheckCircle2 className="w-3.5 h-3.5" /> Émettre</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Students table */}
      <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Étudiant</th>
              <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Organisation</th>
              <th className="text-center px-4 py-3 font-medium">Test</th>
              <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Inscrit le</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {(students || []).map((s: any) => (
              <tr key={s.id} className="border-t border-border/40 hover:bg-muted/20 cursor-pointer" onClick={() => setSelectedId(s.id)}>
                <td className="px-4 py-3">
                  <p className="font-medium">{s.full_name}</p>
                  <p className="text-xs text-muted-foreground">{s.email}</p>
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{s.organization || "—"}</td>
                <td className="px-4 py-3 text-center"><span className="font-mono text-primary">{s.entry_score}/30</span></td>
                <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground text-xs">{s.created_at ? format(new Date(s.created_at), "dd MMM yyyy", { locale: fr }) : "—"}</td>
                <td className="px-4 py-3 text-right"><ChevronRight className="w-4 h-4 text-muted-foreground inline" /></td>
              </tr>
            ))}
            {(students || []).length === 0 && (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">Aucun étudiant inscrit pour le moment.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Student detail drawer */}
      {selectedId !== null && detail && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={() => setSelectedId(null)}>
          <div className="w-full max-w-lg bg-background h-full overflow-y-auto p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">{detail.student.full_name}</h2>
              <Button size="icon" variant="ghost" onClick={() => setSelectedId(null)}><X className="w-5 h-5" /></Button>
            </div>

            <div className="space-y-1 text-sm text-muted-foreground mb-6">
              <p>📧 {detail.student.email}</p>
              {detail.student.phone && <p>📞 {detail.student.phone}</p>}
              {detail.student.organization && <p>🏢 {detail.student.organization}</p>}
              {detail.student.country && <p>🌍 {detail.student.country}</p>}
              <p>📝 Test d'entrée : <span className="text-primary font-medium">{detail.student.entry_score}/30</span></p>
            </div>

            {chartData.length > 0 && (
              <div className="bg-card rounded-2xl border border-border/50 p-4 mb-6">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" /> Évolution des notes</h3>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} formatter={(v: any) => [`${v}%`, "Note"]} />
                    <Line type="monotone" dataKey="pct" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            <h3 className="text-sm font-semibold mb-2">Cours ({detail.enrollments.length})</h3>
            <div className="space-y-2 mb-6">
              {detail.enrollments.map((e: any) => (
                <div key={e.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/40 text-sm">
                  <span>{e.sms_courses?.title}</span>
                  <span className="flex items-center gap-1 text-xs">
                    {e.status === "completed" ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Clock className="w-3.5 h-3.5 text-muted-foreground" />}
                    {e.progress}%
                  </span>
                </div>
              ))}
            </div>

            <h3 className="text-sm font-semibold mb-2">Relevé de notes ({studentGrades.length})</h3>
            <div className="space-y-1">
              {studentGrades.map((g: any) => {
                const pct = Math.round((Number(g.score) / Number(g.max_score)) * 100);
                return (
                  <div key={g.id} className="flex items-center justify-between p-2.5 rounded-lg border border-border/40 text-sm">
                    <span className="truncate">{g.title}</span>
                    <span className={`font-mono shrink-0 ml-2 ${pct >= 70 ? "text-primary" : "text-amber-600 dark:text-amber-400"}`}>{g.score}/{g.max_score} ({pct}%)</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
