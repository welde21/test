import { useState, useEffect } from "react";
import { Habit, JournalEntry } from "./types";
import HabitsTracker from "./components/HabitsTracker";
import JournalReflections from "./components/JournalReflections";
import AnalyticsDashboard from "./components/AnalyticsDashboard";
import AuraCoach from "./components/AuraCoach";
import { Sparkles, Calendar, Heart, Shield, Compass } from "lucide-react";

// Prepopulate date ranges based on today: "2026-06-05"
const TODAY_STR = "2026-06-05";

const formatDateLocal = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

// Generates continuous 7 past days from today YYYY-MM-DD
const generatePastDays = (anchorDateStr: string) => {
  const list = [];
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  
  for (let i = 6; i >= 0; i--) {
    const d = new Date(anchorDateStr);
    d.setDate(d.getDate() - i);
    const dateStr = formatDateLocal(d);
    const isToday = i === 0;
    list.push({
      dateStr,
      label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      short: weekdays[d.getDay()],
      isToday,
    });
  }
  return list;
};

// Default setup helper in case local storage is empty
const getInitialLogs = () => {
  const anchor = new Date(TODAY_STR);
  
  const d0Str = TODAY_STR; // today
  const d1 = new Date(anchor); d1.setDate(anchor.getDate() - 1);
  const d1Str = formatDateLocal(d1); // yesterday
  const d2 = new Date(anchor); d2.setDate(anchor.getDate() - 2);
  const d2Str = formatDateLocal(d2); // 2 days ago
  const d3 = new Date(anchor); d3.setDate(anchor.getDate() - 3);
  const d3Str = formatDateLocal(d3); // 3 days ago

  const defaultHabits: Habit[] = [
    {
      id: "habit-1",
      name: "Drink 3 Liters Water",
      category: "health",
      streak: 2,
      bestStreak: 2,
      color: "health",
      history: { [d2Str]: true, [d1Str]: true },
      createdAt: new Date().toISOString(),
    },
    {
      id: "habit-2",
      name: "Meditate 10 Mins",
      category: "mind",
      streak: 2,
      bestStreak: 2,
      color: "mind",
      history: { [d2Str]: true, [d1Str]: true },
      createdAt: new Date().toISOString(),
    },
    {
      id: "habit-3",
      name: "Read 15 Pages",
      category: "learning",
      streak: 1,
      bestStreak: 2,
      color: "learning",
      history: { [d3Str]: true, [d1Str]: true },
      createdAt: new Date().toISOString(),
    },
    {
      id: "habit-4",
      name: "Daily PM Stretch",
      category: "fitness",
      streak: 0,
      bestStreak: 1,
      color: "fitness",
      history: { [d2Str]: true },
      createdAt: new Date().toISOString(),
    },
    {
      id: "habit-5",
      name: "Review Priorities first",
      category: "routine",
      streak: 1,
      bestStreak: 1,
      color: "routine",
      history: { [d1Str]: true },
      createdAt: new Date().toISOString(),
    },
  ];

  const defaultJournals: JournalEntry[] = [
    {
      id: "journal-1",
      date: d2Str,
      title: "Momentum is Building",
      content: "Woke up with high physical energy. Set clear visual deliverables and started drinking water immediately. Evening meditation helped diffuse office stress.",
      mood: 4,
      createdAt: new Date().toISOString(),
    },
    {
      id: "journal-2",
      date: d1Str,
      title: "Quiet & Reflective Hours",
      content: "A more mindful day. Took some deliberate screens-off blocks in the afternoon. Completed some amazing chapters of my philosophy reading assignment.",
      mood: 5,
      createdAt: new Date().toISOString(),
    },
  ];

  return { defaultHabits, defaultJournals };
};

const MOTIVATIONAL_QUOTES = [
  "Consistency is the companion of true growth.",
  "Your direction is far more important than your speed.",
  "Tiny daily shifts compile into major life milestones.",
  "Wellness is not a chore; it is standard respect for your future self.",
  "What you choose to prioritize today sets the cadence of tomorrow.",
];

export default function App() {
  const pastDates = generatePastDays(TODAY_STR);

  // States
  const [habits, setHabits] = useState<Habit[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(TODAY_STR);
  const [quoteIndex, setQuoteIndex] = useState(0);

  // Hydrate states on mounting
  useEffect(() => {
    const cachedHabits = localStorage.getItem("aura_habits_store");
    const cachedEntries = localStorage.getItem("aura_journals_store");

    const { defaultHabits, defaultJournals } = getInitialLogs();

    if (cachedHabits) {
      try {
        setHabits(JSON.parse(cachedHabits));
      } catch (err) {
        setHabits(defaultHabits);
      }
    } else {
      setHabits(defaultHabits);
    }

    if (cachedEntries) {
      try {
        setJournalEntries(JSON.parse(cachedEntries));
      } catch (err) {
        setJournalEntries(defaultJournals);
      }
    } else {
      setJournalEntries(defaultJournals);
    }

    // Select random motivational quote
    setQuoteIndex(Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length));
  }, []);

  // Save states to local storage on modification
  const handleUpdateHabits = (updated: Habit[]) => {
    setHabits(updated);
    localStorage.setItem("aura_habits_store", JSON.stringify(updated));
  };

  const handleUpdateJournal = (updated: JournalEntry[]) => {
    setJournalEntries(updated);
    localStorage.setItem("aura_journals_store", JSON.stringify(updated));
  };

  const activeDayLabel = pastDates.find(d => d.dateStr === selectedDate)?.label || selectedDate;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-500/10 selection:text-indigo-900 pb-12" id="app-root">
      
      {/* 1. Styled Bento-Style Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-bold text-md shadow-md shadow-indigo-100">
              AS
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-1.5 leading-none">
                Aura Space
              </h1>
              <span className="text-[10px] text-slate-500 font-mono tracking-wider uppercase block mt-1">
                ssum45458@gmail.com
              </span>
            </div>
          </div>

          {/* Inspirational banner quote */}
          <div className="hidden md:block max-w-sm text-right">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5 animate-pulse">Daily Focus Spark</span>
            <p className="text-xs text-slate-600 italic font-medium">
              "{MOTIVATIONAL_QUOTES[quoteIndex]}"
            </p>
          </div>

          {/* Secure system badges */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl">
              <Shield className="w-3.5 h-3.5" />
              <span>LOGS SECURED</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main app body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">
        
        {/* 2. Top Interactive Dates Calendar Strip */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm relative overflow-hidden" id="calendar-strip">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <div>
              <span className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">Interactive Timeline</span>
              <h3 className="text-md font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
                <Calendar className="w-4.5 h-4.5 text-slate-400" />
                Selected: <span className="text-indigo-600 font-extrabold">{activeDayLabel}</span>
              </h3>
            </div>
            <p className="text-[10px] text-slate-400 font-mono italic">
              * Tap any day to review or log custom entries
            </p>
          </div>

          <div className="grid grid-cols-7 gap-3">
            {pastDates.map((day) => {
              const hasLogs = journalEntries.some(e => e.date === day.dateStr);
              const checkedHabitCount = habits.filter(h => h.history[day.dateStr]).length;
              const isSelected = selectedDate === day.dateStr;

              return (
                <button
                  key={day.dateStr}
                  onClick={() => setSelectedDate(day.dateStr)}
                  className={`py-4 rounded-2xl border text-center flex flex-col items-center justify-between gap-3 transition-all duration-200 relative grow ${
                    isSelected
                      ? "bg-indigo-50 border-indigo-600 ring-2 ring-indigo-600/10 text-indigo-950 font-bold shadow-sm"
                      : "border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 text-slate-600 hover:text-slate-800"
                  }`}
                >
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block">
                      {day.short}
                    </span>
                    <span className="text-base font-extrabold block">
                      {day.dateStr.slice(-2)}
                    </span>
                  </div>

                  {/* Indicators for Day's work done */}
                  <div className="flex items-center gap-1.5">
                    {hasLogs && (
                      <span className="w-2 h-2 rounded-full bg-indigo-500" title="Journal logged" />
                    )}
                    {checkedHabitCount > 0 && (
                      <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.5 rounded-lg">
                        +{checkedHabitCount}
                      </span>
                    )}
                  </div>

                  {day.isToday && (
                    <span className="absolute -top-1.5 right-3.5 uppercase font-mono text-[8px] font-black text-indigo-600 tracking-wider">
                      Now
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Columns Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start" id="dashboard-layout">
          
          {/* Column A (Left): Habit tracking checklist (span 5) */}
          <div className="lg:col-span-5 space-y-6">
            <HabitsTracker 
              habits={habits}
              onUpdateHabits={handleUpdateHabits}
              selectedDate={selectedDate}
              pastDates={pastDates}
            />
          </div>

          {/* Column B (Middle): Mindfulness Reflective Journal (span 4) */}
          <div className="lg:col-span-4">
            <JournalReflections
              entries={journalEntries}
              onUpdateEntries={handleUpdateJournal}
              selectedDate={selectedDate}
            />
          </div>

          {/* Column C (Right): Dynamic Insights & Aura Coach Advice panel (span 3) */}
          <div className="lg:col-span-3 space-y-6">
            <AuraCoach
              habits={habits}
              entries={journalEntries}
            />
            <AnalyticsDashboard
              habits={habits}
              entries={journalEntries}
              pastDates={pastDates}
            />
          </div>

        </div>

      </main>

      {/* Bento Style Footer */}
      <footer className="mt-16 max-w-7xl mx-auto px-6 border-t border-slate-200 pt-8 text-center text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-3">
        <p className="flex items-center gap-1.5 font-medium">
          Aura Growth Companion • Crafted in Private Sandbox Space <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
        </p>
        <span className="font-mono text-[10px] text-slate-400">
          UTC REL TO TIME: {TODAY_STR} (Active Simulation)
        </span>
      </footer>

    </div>
  );
}
