import { useState, useEffect } from "react";
import { Habit, JournalEntry, CoachInsight } from "../types";
import { Sparkles, Compass, Lightbulb, Zap, RefreshCw, Loader2, MessageSquareHeart } from "lucide-react";

interface AuraCoachProps {
  habits: Habit[];
  entries: JournalEntry[];
}

export default function AuraCoach({ habits, entries }: AuraCoachProps) {
  const [insight, setInsight] = useState<CoachInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load cached insights from localStorage if available
  useEffect(() => {
    const cached = localStorage.getItem("aura_coaching_insights");
    if (cached) {
      try {
        setInsight(JSON.parse(cached));
      } catch (err) {
        console.error("Failed to parse cached Aura insights", err);
      }
    }
  }, []);

  const handleFetchInsights = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Send a summarized version to stay within standard optimal payloads
        body: JSON.stringify({
          habits: habits.map((h) => ({
            name: h.name,
            category: h.category,
            streak: h.streak,
            history: h.history,
          })),
          journalEntries: entries.map((j) => ({
            date: j.date,
            title: j.title,
            content: j.content,
            mood: j.mood,
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || errorData.error || "Failed to analyze data");
      }

      const data = await response.json();
      if (data.insights) {
        const payload: CoachInsight = {
          ...data.insights,
          generatedAt: new Date().toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
        setInsight(payload);
        localStorage.setItem("aura_coaching_insights", JSON.stringify(payload));
      } else {
        throw new Error("No insight paylod parsed correctly");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred while consulting Aura.");
    } finally {
      setLoading(false);
    }
  };

  const hasLoggedToday = entries.some(
    (e) => e.date === new Date().toISOString().split("T")[0]
  );

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm relative overflow-hidden" id="aura-coach-panel">
      {/* Decorative backdrop glow */}
      <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-500/5 rounded-full blur-3xl" />

      <div className="flex items-center justify-between mb-6 relative">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Compass className="w-5 h-5 text-indigo-600" />
            Aura AI Coach
          </h2>
          <p className="text-xs text-slate-500 mt-1">Holistic wellness advice powered by Gemini.</p>
        </div>

        {insight && (
          <button
            onClick={handleFetchInsights}
            disabled={loading || habits.length === 0}
            className="text-slate-400 hover:text-slate-700 hover:bg-slate-50 p-2 rounded-xl transition disabled:opacity-40"
            title="Refresh Coach advice"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 animate-in fade-in" id="coach-loading">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-indigo-600/10 border-t-indigo-600 animate-spin" />
            <Sparkles className="w-5 h-5 text-indigo-600 absolute top-3.5 left-3.5 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-900">Consulting Aura...</h4>
            <p className="text-xs text-slate-500 max-w-[260px] mx-auto italic">
              "Mapping habit patterns, scoring sentiment, and refining tomorrow's challenges..."
            </p>
          </div>
        </div>
      ) : error ? (
        <div className="text-center py-12 border border-dashed border-rose-200 bg-rose-50/40 rounded-2xl space-y-3" id="coach-error">
          <p className="text-xs text-rose-700 max-w-xs mx-auto font-bold">{error}</p>
          <button
            onClick={handleFetchInsights}
            className="bg-rose-600 hover:bg-rose-500 text-white text-xs px-4 py-2 rounded-xl border border-transparent transition font-bold"
          >
            Retry Consultation
          </button>
        </div>
      ) : !insight ? (
        <div className="text-center py-12 border border-dashed border-slate-200 bg-slate-50/30 rounded-2xl space-y-4" id="coach-prompt">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center mx-auto text-indigo-600 border border-indigo-100">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div className="space-y-1 select-none">
            <h4 className="text-sm font-bold text-slate-900">Aura is Ready to Coach</h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
              Once you have populated habits and completed a journal log, consult Aura to unlock personalized progress counsel.
            </p>
          </div>

          <button
            onClick={handleFetchInsights}
            disabled={habits.length === 0}
            className={`w-full py-3 rounded-xl font-bold text-xs transition duration-200 flex items-center justify-center gap-2 shadow-sm ${
              habits.length > 0
                ? "bg-indigo-600 hover:bg-indigo-550 text-white cursor-pointer hover:shadow-indigo-500/10"
                : "bg-slate-100 text-slate-350 cursor-not-allowed"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Consult Aura AI Coach
          </button>
          {!hasLoggedToday && habits.length > 0 && (
            <p className="text-[10px] text-slate-400 italic">
              Tip: Consider adding today's journal entry first for high alignment.
            </p>
          )}
        </div>
      ) : (
        // Loaded Coach Insights View
        <div className="space-y-6 animate-in fade-in duration-350" id="coach-insights-loaded">
          {/* Header Theme Word Banner */}
          <div className="p-4 bg-gradient-to-r from-indigo-50/50 via-slate-50 to-indigo-50/50 border border-indigo-100/60 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-1.5 text-[8px] font-mono text-slate-400 font-bold">
              Fetched: {insight.generatedAt}
            </div>
            
            <div className="flex items-center gap-3">
              <div className="bg-white border border-indigo-100 rounded-xl px-2.5 py-1.5 text-center flex-shrink-0 shadow-xs">
                <span className="text-[8px] font-mono text-slate-400 uppercase tracking-wider block">Glow Index</span>
                <span className="text-lg font-black text-indigo-600 font-mono leading-none flex items-center justify-center mt-0.5">{insight.sentimentScore}%</span>
              </div>
              <div className="min-w-0">
                <span className="text-[9px] font-mono tracking-widest text-indigo-500 font-extrabold uppercase">Theme for this phase</span>
                <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-tight flex items-center gap-1.5 truncate">
                  {insight.focusWord}
                </h3>
              </div>
            </div>
          </div>

          {/* Core Counsel & Emotional sentiment summary */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Aura's Core Assessment</span>
            <div className="p-4 bg-slate-50/50 border border-slate-150 rounded-2xl">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <MessageSquareHeart className="w-4 h-4 text-indigo-600" />
                {insight.overallMood}
              </h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed italic">
                "{insight.encouragement}"
              </p>
            </div>
          </div>

          {/* Actionable points */}
          <div className="space-y-2.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Coaching Directives</span>
            <div className="space-y-2">
              {insight.bulletAdvice.map((advice, idx) => (
                <div key={idx} className="flex gap-2.5 items-start p-3 bg-slate-50/50 border border-slate-100 rounded-2xl group hover:border-slate-200 transition">
                  <div className="p-1 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex-shrink-0">
                    <Lightbulb className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed transition">
                    {advice}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Tomorrow's micro-challenge */}
          <div className="p-4 bg-indigo-50/80 border border-indigo-100 rounded-2xl relative overflow-hidden group">
            <div className="absolute -top-3 -right-3 w-10 h-10 bg-indigo-400/5 rounded-full blur-xl group-hover:scale-150 transition" />
            <div className="flex gap-3 items-start relative">
              <div className="p-1.5 rounded-lg bg-white/80 text-indigo-600 flex-shrink-0 mt-0.5 border border-indigo-100/40">
                <Zap className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[9px] font-mono tracking-widest text-indigo-600 font-extrabold uppercase">Daily Blueprint Challenge</span>
                <p className="text-xs text-slate-800 font-bold mt-1 leading-normal">
                  {insight.challenge}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleFetchInsights}
            className="w-full py-2 border border-slate-200 hover:border-indigo-200 text-slate-500 hover:text-indigo-600 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 transition flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Recalibrate Advice
          </button>
        </div>
      )}
    </div>
  );
}
