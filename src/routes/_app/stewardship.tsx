import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Heart, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_app/stewardship")({ component: Stewardship });

function Stewardship() {
  const { data: list } = useQuery({
    queryKey: ["devotionals-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("devotionals")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const today = list && list.length > 0 ? list[new Date().getDate() % list.length] : null;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Daily stewardship</p>
        <h2 className="text-2xl font-semibold tracking-tight">Word & wisdom for your finances</h2>
      </div>

      {today && (
        <div className="rounded-3xl border bg-gradient-hero p-8 text-primary-foreground shadow-elevated">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest opacity-80">
            <Sparkles className="h-4 w-4" /> Today's reflection
          </div>
          <blockquote className="mt-4 text-2xl font-medium italic leading-relaxed">
            "{today.verse}"
          </blockquote>
          <p className="mt-2 text-sm opacity-90">— {today.verse_reference}</p>
          <div className="mt-6 rounded-2xl bg-white/10 p-5 backdrop-blur">
            <div className="text-xs uppercase tracking-widest opacity-80">Ellen G. White</div>
            <p className="mt-2 leading-relaxed">{today.egw_quote}</p>
            {today.egw_source && <p className="mt-2 text-xs opacity-80">— {today.egw_source}</p>}
          </div>
          <div className="mt-6 rounded-2xl bg-white/10 p-5 backdrop-blur">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest opacity-80">
              <Heart className="h-3.5 w-3.5" /> Reflection
            </div>
            <p className="mt-2 leading-relaxed">{today.reflection}</p>
          </div>
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold tracking-tight">Library</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {(list ?? []).map((d) => (
            <div key={d.id} className="rounded-2xl border bg-card p-5 shadow-card">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-primary">
                <BookOpen className="h-3.5 w-3.5" /> {d.tag}
              </div>
              <p className="mt-2 italic leading-relaxed">"{d.verse}"</p>
              <p className="mt-1 text-xs text-muted-foreground">— {d.verse_reference}</p>
              <p className="mt-3 text-sm text-muted-foreground">{d.egw_quote}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
