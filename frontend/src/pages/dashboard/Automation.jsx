import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink, AlertTriangle } from "lucide-react";
import { getN8nUrl } from "@/lib/integrations";

export default function Automation() {
  const [url, setUrl] = useState("");
  useEffect(() => { getN8nUrl().then(setUrl).catch(() => {}); }, []);
  const configured = url && !url.includes("your-n8n.example.com");

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
            <a href={url} target="_blank" rel="noreferrer">
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
                Open <a className="underline text-foreground" href="/dashboard/integrations">Integrations</a> and configure the n8n card with your instance URL (cloud or self-hosted).
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <iframe
            src={url}
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
