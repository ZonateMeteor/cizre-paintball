import { Database, Terminal } from 'lucide-react'

export function SetupNotice() {
  return (
    <div className="flex min-h-dvh items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-primary/40 bg-card/80 p-6 backdrop-blur border-glow-purple">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-xl bg-primary/20 p-2.5 text-primary">
            <Database className="size-6" />
          </div>
          <h1 className="font-mono text-xl font-bold tracking-widest text-glow-purple">
            KURULUM GEREKLİ
          </h1>
        </div>
        <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
          Cizre Paintball için Supabase bağlantısı gerekiyor. Proje ayarlarındaki{' '}
          <span className="text-accent">Vars</span> bölümünden şu değişkenleri ekleyin:
        </p>
        <ul className="mb-4 space-y-2 font-mono text-xs">
          <li className="rounded-lg border border-border bg-background/60 px-3 py-2 text-accent">
            NEXT_PUBLIC_SUPABASE_URL
          </li>
          <li className="rounded-lg border border-border bg-background/60 px-3 py-2 text-accent">
            NEXT_PUBLIC_SUPABASE_ANON_KEY
          </li>
        </ul>
        <div className="flex items-start gap-2 rounded-lg border border-accent/30 bg-accent/10 px-3 py-2.5 text-xs text-muted-foreground">
          <Terminal className="mt-0.5 size-4 shrink-0 text-accent" />
          <span>
            Ardından <span className="text-foreground">scripts/001_init_schema.sql</span>{' '}
            dosyasını Supabase SQL editöründe çalıştırın.
          </span>
        </div>
      </div>
    </div>
  )
}
