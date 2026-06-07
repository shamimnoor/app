import React from "react";
import { N8N_EMBED_URL } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ExternalLink, AlertTriangle } from "lucide-react";

export default function Automation() {
  const configured = N8N_EMBED_URL && !N8N_EMBED_URL.includes("your-n8n.example.com");

  return (
    <div className="space-y-6" data-testid="automation-page">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="label-mono">Automation Center</div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mt-2">n8n workflows</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your self-hosted n8n instance, embedded right here.
          </p>
        </div>
        {configured && (
          <Button asChild variant="outline" data-testid="automation-open-new-tab">
            <a href={N8N_EMBED_URL} target="_blank" rel="noreferrer">
              Open in new tab <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
            </a>
          </Button>
        )}
      </div>

      {!configured ? (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6" data-testid="automation-not-configured">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
            <div>
              <div className="font-display text-lg font-semibold text-foreground">No n8n instance configured</div>
              <p className="text-sm text-muted-foreground mt-1 max-w-xl">
                Set <code className="font-mono px-1.5 py-0.5 rounded bg-secondary text-foreground">REACT_APP_N8N_EMBED_URL</code> in your Vercel project's Environment Variables (and in <code className="font-mono px-1.5 py-0.5 rounded bg-secondary text-foreground">/app/frontend/.env</code> for the preview) to embed your n8n editor here. n8n cloud and self-hosted instances both work.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm">
                  <a href="https://n8n.cloud" target="_blank" rel="noreferrer">Get n8n.cloud <ExternalLink className="w-3 h-3 ml-1.5" /></a>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <a href="https://docs.n8n.io/hosting/" target="_blank" rel="noreferrer">Self-host docs <ExternalLink className="w-3 h-3 ml-1.5" /></a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <iframe
            src={N8N_EMBED_URL}
            title="n8n Automation Center"
            className="w-full h-[80vh] block"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
            data-testid="automation-iframe"
          />
        </div>
      )}
    </div>
  );
}
