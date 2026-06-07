import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const STATUSES = ["new", "qualified", "proposal", "won", "lost"];
const COLOR = {
  new: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  qualified: "bg-blue-500/15 text-blue-500 border-blue-500/30",
  proposal: "bg-violet-500/15 text-violet-500 border-violet-500/30",
  won: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  lost: "bg-rose-500/15 text-rose-500 border-rose-500/30",
};

export default function CRM() {
  const [leads, setLeads] = useState([]);

  const load = () => api.get("/admin/leads").then((r) => setLeads(r.data.items)).catch(()=>{});
  useEffect(() => { load(); }, []);

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/admin/leads/${id}`, { status });
      toast.success("Lead updated");
      load();
    } catch { toast.error("Could not update lead"); }
  };

  return (
    <div className="space-y-8" data-testid="dashboard-crm">
      <div>
        <div className="label-mono">CRM</div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mt-2">Leads & pipeline</h1>
        <p className="text-sm text-muted-foreground mt-1">{leads.length} leads · {leads.filter(l => l.status === "new").length} new</p>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40">
              <tr className="text-left">
                <th className="px-4 py-3 label-mono">Name</th>
                <th className="px-4 py-3 label-mono">Company</th>
                <th className="px-4 py-3 label-mono">Budget</th>
                <th className="px-4 py-3 label-mono">Timeline</th>
                <th className="px-4 py-3 label-mono">Source</th>
                <th className="px-4 py-3 label-mono">Status</th>
                <th className="px-4 py-3 label-mono">Received</th>
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">No leads yet.</td></tr>
              )}
              {leads.map((l) => (
                <tr key={l.id} className="border-t border-border" data-testid={`lead-row-${l.id}`}>
                  <td className="px-4 py-3">
                    <div className="font-medium">{l.name}</div>
                    <div className="text-xs text-muted-foreground">{l.email}</div>
                  </td>
                  <td className="px-4 py-3">{l.company || "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs">{l.budget || "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs">{l.timeline || "—"}</td>
                  <td className="px-4 py-3"><Badge variant="outline" className="font-mono text-[10px]">{l.source}</Badge></td>
                  <td className="px-4 py-3">
                    <Select value={l.status} onValueChange={(v) => updateStatus(l.id, v)}>
                      <SelectTrigger className={`h-8 text-xs w-32 ${COLOR[l.status] || ""}`} data-testid={`lead-status-${l.id}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{new Date(l.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
