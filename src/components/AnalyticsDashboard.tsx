import { Habit, JournalEntry } from "../types";
import { TrendingUp, BarChart3, Sun, HelpCircle, Activity } from "lucide-react";

interface AnalyticsDashboardProps {
  habits: Habit[];
  entries: JournalEntry[];
  pastDates: { dateStr: string; label: string; short: string; isToday: boolean }[];
}

export default function AnalyticsDashboard({ habits, entries, pastDates }: AnalyticsDashboardProps) {
  // 1. Calculate Habit Completion Rates over the past 7 days
  const habitsRates = habits.map((habit) => {
    let completedCount = 0;
    pastDates.forEach((d) => {
      if (habit.history[d.dateStr]) {
        completedCount++;
      }
    });
    const completionRate = pastDates.length > 0 ? (completedCount / pastDates.length) * 100 : 0;
    return {
      name: habit.name,
      rate: Math.round(completionRate),
      category: habit.category,
    };
  });

  // Calculate Overall Habit Completion
  let totalLogsExpected = habits.length * pastDates.length;
  let totalLogsDone = 0;
  habits.forEach((h) => {
    pastDates.forEach((d) => {
      if (h.history[d.dateStr]) totalLogsDone++;
    });
  });
  const overallCompletionRate = totalLogsExpected > 0 ? Math.round((totalLogsDone / totalLogsExpected) * 100) : 0;

  // 2. Prepare Mood Timeline points for Custom SVG Wave
  // We match our pastDates array (earliest to latest) to mood entries.
  const moodPoints = pastDates.map((day, idx) => {
    const entry = entries.find((e) => e.date === day.dateStr);
    return {
      dateStr: day.dateStr,
      short: day.short,
      dayNum: day.dateStr.slice(-2),
      mood: entry ? entry.mood : null, // null means no entry
    };
  });

  // SVG dimensions for the Emotional Wave
  const svgWidth = 400;
  const svgHeight = 160;
  const paddingLeft = 30;
  const paddingRight = 15;
  const paddingTop = 20;
  const paddingBottom = 25;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  // X coordinate spacing
  const xStep = moodPoints.length > 1 ? chartWidth / (moodPoints.length - 1) : chartWidth;

  // Generate SVG coordinates for present moods
  const points: { x: number; y: number; mood: number; label: string; date: string }[] = [];
  moodPoints.forEach((p, idx) => {
    if (p.mood !== null) {
      const x = paddingLeft + idx * xStep;
      // Mood is 1 to 5. Map 5 to top (paddingTop) and 1 to bottom (paddingTop + chartHeight)
      const normalizedMood = (p.mood - 1) / 4; // 0 to 1
      const y = paddingTop + chartHeight - normalizedMood * chartHeight;
      points.push({ x, y, mood: p.mood, label: p.short, date: p.dateStr });
    }
  });

  // Construct SVG path string for the polyline/spline
  let pathString = "";
  let areaPathString = "";
  if (points.length > 0) {
    pathString = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      pathString += ` L ${points[i].x} ${points[i].y}`;
    }

    // Closed loop for gradient area
    areaPathString = `${pathString} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`;
  }

  // Calculate generic categories contribution rate
  const categorySummary: { [cat: string]: { expected: number; actual: number; color: string } } = {
    health: { expected: 0, actual: 0, color: "bg-emerald-500" },
    learning: { expected: 0, actual: 0, color: "bg-indigo-500" },
    mind: { expected: 0, actual: 0, color: "bg-amber-500" },
    fitness: { expected: 0, actual: 0, color: "bg-rose-500" },
    routine: { expected: 0, actual: 0, color: "bg-sky-500" },
  };

  habits.forEach((h) => {
    if (categorySummary[h.category]) {
      categorySummary[h.category].expected += pastDates.length;
      pastDates.forEach((d) => {
        if (h.history[d.dateStr]) categorySummary[h.category].actual++;
      });
    }
  });

  const categoriesData = Object.entries(categorySummary)
    .map(([name, val]) => {
      const rate = val.expected > 0 ? Math.round((val.actual / val.expected) * 100) : 0;
      return { name, rate, color: val.color };
    })
    .filter((c) => c.rate > 0 || habits.some((h) => h.category === c.name));

  return (
    <div className="space-y-6" id="analytics-panel">
      {/* 1. Habit Completion Rate Progress Panel */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl" />

        <div className="flex items-center justify-between mb-5 select-none">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              Insight Dashboard
            </h2>
            <p className="text-xs text-slate-500 mt-1">Completion statistics & emotional progression.</p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-1.5 text-center">
            <span className="text-[10px] font-mono text-slate-400 font-bold uppercase block">Consistency</span>
            <span className="text-md font-extrabold text-indigo-600">{overallCompletionRate}%</span>
          </div>
        </div>

        {/* Habit Bars */}
        <div className="space-y-3.5 mb-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Weekly Habit Consistency</h3>
          {habitsRates.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-2">Add habits to see completion metrics.</p>
          ) : (
            habitsRates.map((hr, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-700 truncate max-w-[210px]">{hr.name}</span>
                  <span className="text-indigo-600 font-mono font-bold">{hr.rate}%</span>
                </div>
                {/* Visual Bar */}
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200/50">
                  <div
                    style={{ width: `${hr.rate}%` }}
                    className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${
                      hr.category === "health" ? "from-emerald-500 to-emerald-400" :
                      hr.category === "learning" ? "from-indigo-600 to-indigo-400" :
                      hr.category === "mind" ? "from-amber-500 to-amber-400" :
                      hr.category === "fitness" ? "from-rose-500 to-rose-400" :
                      "from-sky-500 to-sky-400"
                    }`}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 2. Custom Emotional Wave Curve Panel */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm relative overflow-hidden">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-indigo-600" />
          Emotional Flow Wave
        </h3>

        {points.length < 2 ? (
          <div className="text-center py-10 bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl">
            <HelpCircle className="w-8 h-8 text-slate-350 mx-auto mb-2" />
            <p className="text-xs text-slate-450 font-bold px-4">
              Commit thoughts and mood scores for at least 2 days to render your wellness curve.
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* SVG Plot */}
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto overflow-visible select-none">
              <defs>
                <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.00" />
                </linearGradient>
                <linearGradient id="lineColor" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#4f46e5" />
                  <stop offset="50%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#818cf8" />
                </linearGradient>
              </defs>

              {/* Grid backdrop */}
              {[1, 2, 3, 4, 5].map((yVal) => {
                const normalized = (yVal - 1) / 4;
                const h = paddingTop + chartHeight - normalized * chartHeight;
                return (
                  <g key={yVal} className="opacity-65">
                    <line
                      x1={paddingLeft}
                      y1={h}
                      x2={svgWidth - paddingRight}
                      y2={h}
                      stroke="#f1f5f9"
                      strokeWidth="1.5"
                    />
                    <text
                      x={paddingLeft - 8}
                      y={h + 3}
                      fill="#94a3b8"
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="end"
                    >
                      {yVal === 5 ? "🎉" : yVal === 3 ? "😐" : yVal === 1 ? "😢" : ""}
                    </text>
                  </g>
                );
              })}

              {/* Gradient Area under curve */}
              {areaPathString && <path d={areaPathString} fill="url(#moodGradient)" />}

              {/* Connector Stroke Line */}
              {pathString && (
                <path
                  d={pathString}
                  fill="none"
                  stroke="url(#lineColor)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Point Markers with labels */}
              {points.map((p, idx) => (
                <g key={idx}>
                  {/* Outer circle halo */}
                  <circle cx={p.x} cy={p.y} r="6" fill="#ffffff" stroke="#4f46e5" strokeWidth="2.5" />
                  {/* Tooltip-like mood level marker */}
                  <circle cx={p.x} cy={p.y} r="2" fill="#4f46e5" />
                </g>
              ))}

              {/* X Axis dates label */}
              {moodPoints.map((p, idx) => {
                const x = paddingLeft + idx * xStep;
                return (
                  <text
                    key={idx}
                    x={x}
                    y={svgHeight - 6}
                    fill={p.mood ? "#1e293b" : "#cbd5e1"}
                    fontSize="9"
                    fontFamily="sans-serif"
                    textAnchor="middle"
                    className="font-bold"
                  >
                    {p.short}
                  </text>
                );
              })}
            </svg>
            <div className="flex justify-between items-center mt-3 px-3 font-mono text-[9px] text-slate-400 font-bold">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" /> Early Week
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" /> Today
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 3. Routine Balance Donut Indicator / Category Breakdown */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm relative overflow-hidden">
        <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-4 flex items-center gap-1.5">
          <Sun className="w-4 h-4 text-indigo-600" />
          Wellness Balance Matrix
        </h3>

        {categoriesData.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No category insights available yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 items-center">
            <div className="space-y-2.5">
              {categoriesData.map((cd, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 capitalize text-slate-650 font-semibold min-w-0">
                    <span className={`w-2 h-2 rounded-full ${cd.color} flex-shrink-0`} />
                    <span className="truncate">{cd.name}</span>
                  </div>
                  <span className="font-mono font-bold text-slate-400">{cd.rate}%</span>
                </div>
              ))}
            </div>

            {/* Micro simple mini composite SVG bar visual */}
            <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-150 relative">
              <span className="text-[9px] font-bold text-slate-400 uppercase">Harmonizer</span>
              <span className="text-lg font-black text-indigo-600 mt-0.5">
                {categoriesData.length > 0 
                  ? Math.round(categoriesData.reduce((acc, curr) => acc + curr.rate, 0) / categoriesData.length) 
                  : 0}%
              </span>
              <p className="text-[8px] text-slate-400 mt-1 italic text-center font-medium">Progress consistency score</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
