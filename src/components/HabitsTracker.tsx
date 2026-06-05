import React, { useState } from "react";
import { Habit } from "../types";
import { 
  Plus, Trash2, Flame, Droplet, Brain, Dumbbell, BookOpen, Clock, AlertCircle, Check, Sparkles 
} from "lucide-react";

interface HabitsTrackerProps {
  habits: Habit[];
  onUpdateHabits: (updated: Habit[]) => void;
  selectedDate: string; // YYYY-MM-DD
  pastDates: { dateStr: string; label: string; short: string; isToday: boolean }[];
}

const CATEGORY_META = {
  health: { label: "Health", color: "from-emerald-500 to-teal-500", bg: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: Droplet },
  learning: { label: "Learning", color: "from-indigo-500 to-blue-500", bg: "bg-indigo-50 text-indigo-700 border-indigo-200", icon: BookOpen },
  mind: { label: "Mind", color: "from-amber-500 to-orange-500", bg: "bg-amber-50 text-amber-700 border-amber-200", icon: Brain },
  fitness: { label: "Fitness", color: "from-rose-500 to-pink-500", bg: "bg-rose-50 text-rose-700 border-rose-200", icon: Dumbbell },
  routine: { label: "Routine", color: "from-sky-500 to-cyan-500", bg: "bg-sky-50 text-sky-700 border-sky-200", icon: Clock },
};

export default function HabitsTracker({ habits, onUpdateHabits, selectedDate, pastDates }: HabitsTrackerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newHabitName, setNewHabitName] = useState("");
  const [newHabitCategory, setNewHabitCategory] = useState<keyof typeof CATEGORY_META>("health");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const computeStreak = (history: { [dateStr: string]: boolean }, todayStr: string): { current: number; best: number } => {
    let current = 0;
    const historyDates = Object.keys(history).filter(k => history[k]).sort();
    if (historyDates.length === 0) return { current: 0, best: 0 };

    // Compute Current Streak
    const today = new Date(todayStr);
    const formatDate = (date: Date) => date.toISOString().split("T")[0];

    let checkDate = new Date(today);
    const todayCompleted = !!history[formatDate(today)];
    
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayCompleted = !!history[formatDate(yesterday)];

    if (!todayCompleted && !yesterdayCompleted) {
      current = 0;
    } else {
      let check = todayCompleted ? today : yesterday;
      while (true) {
        const checkStr = formatDate(check);
        if (history[checkStr]) {
          current++;
          check.setDate(check.getDate() - 1);
        } else {
          break;
        }
      }
    }

    // Compute Best Streak
    let best = 0;
    let temp = 0;
    // Iterate from the earliest history date to today to find the longest consecutive run.
    const start = new Date(historyDates[0]);
    const end = new Date(todayStr);
    let iter = new Date(start);

    while (iter <= end) {
      const iterStr = formatDate(iter);
      if (history[iterStr]) {
        temp++;
        if (temp > best) best = temp;
      } else {
        temp = 0;
      }
      iter.setDate(iter.getDate() + 1);
    }

    return { current, best: Math.max(best, current) };
  };

  const handleToggleHabit = (habitId: string, dateStr: string) => {
    const updated = habits.map((h) => {
      if (h.id === habitId) {
        const newHistory = { ...h.history };
        if (newHistory[dateStr]) {
          delete newHistory[dateStr];
        } else {
          newHistory[dateStr] = true;
        }
        const streaks = computeStreak(newHistory, selectedDate);
        return {
          ...h,
          history: newHistory,
          streak: streaks.current,
          bestStreak: Math.max(h.bestStreak, streaks.best),
        };
      }
      return h;
    });
    onUpdateHabits(updated);
  };

  const handleAddHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;

    const newHabit: Habit = {
      id: crypto.randomUUID(),
      name: newHabitName.trim(),
      category: newHabitCategory,
      streak: 0,
      bestStreak: 0,
      color: newHabitCategory,
      history: {},
      createdAt: new Date().toISOString(),
    };

    onUpdateHabits([...habits, newHabit]);
    setNewHabitName("");
    setIsAdding(false);
  };

  const handleDeleteHabit = (id: string) => {
    if (confirm("Are you sure you want to delete this habit? All history will be removed.")) {
      onUpdateHabits(habits.filter((h) => h.id !== id));
    }
  };

  const filteredHabits = filterCategory === "all" 
    ? habits 
    : habits.filter(h => h.category === filterCategory);

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm relative overflow-hidden" id="habits-panel">
      {/* Decorative backdrop glow */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl" />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            Habit Routine
          </h2>
          <p className="text-xs text-slate-500 mt-1">Check off habits to build momentum.</p>
        </div>

        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 font-bold transition shadow-sm"
          id="btn-add-habit-trigger"
        >
          <Plus className="w-4 h-4" />
          Add Habit
        </button>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        <button
          onClick={() => setFilterCategory("all")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
            filterCategory === "all" 
              ? "bg-indigo-50 text-indigo-700 border-indigo-200" 
              : "border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          All
        </button>
        {Object.entries(CATEGORY_META).map(([key, value]) => (
          <button
            key={key}
            onClick={() => setFilterCategory(key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1 leading-none ${
              filterCategory === key 
                ? `${value.bg} ring-1 ring-offset-0 ring-indigo-200` 
                : "border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            {React.createElement(value.icon, { className: "w-3 h-3" })}
            {value.label}
          </button>
        ))}
      </div>

      {/* Inline Create Habit Form */}
      {isAdding && (
        <form onSubmit={handleAddHabit} className="mb-6 p-5 bg-slate-50 border border-slate-200 rounded-2xl animate-in fade-in slide-in-from-top-3 duration-200" id="habit-form">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Create New Habit</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Habit Name</label>
              <input
                type="text"
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                placeholder="E.g., Practice guitar 15 mins"
                className="w-full text-sm py-2.5 px-3.5 bg-white border border-slate-250 focus:border-indigo-600 rounded-xl text-slate-900 placeholder-slate-400 outline-none transition"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Category & Focus Color</label>
              <div className="grid grid-cols-5 gap-1.5">
                {Object.entries(CATEGORY_META).map(([key, value]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setNewHabitCategory(key as any)}
                    className={`py-2 px-1 rounded-xl border text-center flex flex-col items-center gap-1.5 transition ${
                      newHabitCategory === key 
                        ? `${value.bg} ring-2 ring-indigo-500/20` 
                        : "border-slate-200 bg-white hover:bg-slate-50 text-slate-500"
                    }`}
                  >
                    {React.createElement(value.icon, { className: "w-4 h-4" })}
                    <span className="text-[10px] font-bold">{value.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="text-xs text-slate-500 hover:text-slate-800 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 transition font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-4.5 py-2 rounded-xl font-bold transition shadow-sm"
              >
                Save Habit
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Habits List & Weekly Completion matrix */}
      {filteredHabits.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl" id="habits-empty">
          <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-400 font-bold">No habits found in this category.</p>
          <p className="text-xs text-slate-400 mt-1">Configure presets or tap 'Add Habit' above.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Header Row for dates */}
          <div className="grid grid-cols-12 gap-2 text-center pb-2 border-b border-slate-100 font-mono text-[10px] text-slate-400 font-bold">
            <div className="col-span-5 text-left font-sans">Habit Name</div>
            <div className="col-span-1">Str</div>
            {pastDates.map((day) => (
              <div 
                key={day.dateStr} 
                className={`col-span-1 flex flex-col items-center justify-center rounded-lg py-0.5 ${
                  day.isToday ? "bg-indigo-50 text-indigo-600 font-extrabold" : ""
                }`}
                title={day.label}
              >
                <span>{day.short}</span>
                <span className="scale-90 opacity-90">{day.dateStr.slice(-2)}</span>
              </div>
            ))}
          </div>

          {/* Each Habit in list */}
          {filteredHabits.map((habit) => {
            const cat = CATEGORY_META[habit.category as keyof typeof CATEGORY_META] || CATEGORY_META.health;
            const HabitIcon = cat.icon;

            return (
              <div 
                key={habit.id} 
                className="grid grid-cols-12 gap-2 items-center text-center p-3 rounded-2xl bg-slate-50/50 border border-slate-100/80 hover:border-slate-200 hover:bg-slate-50 transition duration-200 group relative"
              >
                {/* Info */}
                <div className="col-span-5 text-left flex items-center gap-2.5 min-w-0">
                  <div className={`p-2 rounded-xl bg-gradient-to-tr ${cat.color} text-white shadow-sm flex-shrink-0`}>
                    <HabitIcon className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate">
                    <h4 className="text-xs font-bold text-slate-800 group-hover:text-slate-900 transition truncate" title={habit.name}>
                      {habit.name}
                    </h4>
                    <span className="text-[9px] text-slate-400 block capitalize font-medium">{habit.category}</span>
                  </div>
                </div>

                {/* Streak */}
                <div className="col-span-1 flex items-center justify-center">
                  <div className={`flex items-center gap-0.5 text-xs text-orange-600 ${habit.streak > 0 ? "font-black" : "opacity-40"}`} title={`Current streak: ${habit.streak} days. Best: ${habit.bestStreak}`}>
                    <Flame className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{habit.streak}</span>
                  </div>
                </div>

                {/* Days checkboxes */}
                {pastDates.map((day) => {
                  const completed = !!habit.history[day.dateStr];
                  return (
                    <div key={day.dateStr} className="col-span-1 flex justify-center">
                      <button
                        onClick={() => handleToggleHabit(habit.id, day.dateStr)}
                        className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
                          completed 
                            ? `bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700 scale-105 shadow-md shadow-indigo-600/10`
                            : day.isToday
                              ? "border-indigo-400 bg-indigo-50/20 hover:bg-indigo-50 hover:border-indigo-600"
                              : "border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300"
                        }`}
                        title={`${habit.name}: ${completed ? "Done" : "Incomplete"} on ${day.label}`}
                      >
                        {completed && <Check className="w-4 h-4 stroke-[3]" />}
                      </button>
                    </div>
                  );
                })}

                {/* Absolute hovering trash */}
                <button
                  onClick={() => handleDeleteHabit(habit.id)}
                  className="absolute right-2 opacity-0 group-hover:opacity-100 hover:text-rose-600 text-slate-300 p-1.5 rounded-lg transition hover:bg-slate-200"
                  title="Delete habit"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
