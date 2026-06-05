import React, { useState } from "react";
import { JournalEntry } from "../types";
import { BookOpen, Search, Sparkles, Smile, Trash2, Calendar, SmilePlus, PenLine } from "lucide-react";

interface JournalReflectionsProps {
  entries: JournalEntry[];
  onUpdateEntries: (updated: JournalEntry[]) => void;
  selectedDate: string; // YYYY-MM-DD
}

const MOODS = [
  { value: 1, label: "Heavy", emoji: "😢", desc: "Low energy, stressed, or down", color: "text-rose-700 bg-rose-50 border-rose-200" },
  { value: 2, label: "Tired", emoji: "🙁", desc: "Struggling or fatigued", color: "text-orange-700 bg-orange-50 border-orange-200" },
  { value: 3, label: "Balanced", emoji: "😐", desc: "Neutral, calm, or routine", color: "text-sky-700 bg-sky-50 border-sky-200" },
  { value: 4, label: "Energized", emoji: "🙂", desc: "Positive, peaceful, or building", color: "text-emerald-750 bg-emerald-50 border-emerald-200" },
  { value: 5, label: "Fulfilled", emoji: "🎉", desc: "Joyous, high-achievement, or clear", color: "text-indigo-700 bg-indigo-50 border-indigo-200" },
];

const WRITING_PROMPTS = [
  "What is one tiny victory or graceful moment from today?",
  "What challenge did you face today, and what did it teach you about your resilience?",
  "Who did you feel connected to today, and why?",
  "What habit felt easiest to complete today? Which one felt hardest, and why?",
  "Write down three things you are looking forward to tomorrow.",
];

export default function JournalReflections({ entries, onUpdateEntries, selectedDate }: JournalReflectionsProps) {
  // Current entry state (automatically tied to the selected Date)
  const currentEntry = entries.find((e) => e.date === selectedDate) || {
    id: "",
    date: selectedDate,
    title: "",
    content: "",
    mood: 3,
    createdAt: "",
  };

  const [titleInput, setTitleInput] = useState(currentEntry.title || "");
  const [contentInput, setContentInput] = useState(currentEntry.content || "");
  const [moodInput, setMoodInput] = useState<number>(currentEntry.mood || 3);
  const [promptIndex, setPromptIndex] = useState(0);

  // Search and view logs state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMood, setFilterMood] = useState<number | "all">("all");

  // Keep state in sync when selectedDate changes
  React.useEffect(() => {
    const matched = entries.find((e) => e.date === selectedDate);
    if (matched) {
      setTitleInput(matched.title);
      setContentInput(matched.content);
      setMoodInput(matched.mood);
    } else {
      setTitleInput("");
      setContentInput("");
      setMoodInput(3);
    }
  }, [selectedDate, entries]);

  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contentInput.trim()) return;

    const matchedIndex = entries.findIndex((e) => e.date === selectedDate);
    const updated = [...entries];

    if (matchedIndex >= 0) {
      updated[matchedIndex] = {
        ...updated[matchedIndex],
        title: titleInput.trim() || `Reflection for ${selectedDate}`,
        content: contentInput.trim(),
        mood: moodInput,
        createdAt: updated[matchedIndex].createdAt || new Date().toISOString(),
      };
    } else {
      updated.push({
        id: crypto.randomUUID(),
        date: selectedDate,
        title: titleInput.trim() || `Reflection for ${selectedDate}`,
        content: contentInput.trim(),
        mood: moodInput,
        createdAt: new Date().toISOString(),
      });
    }

    onUpdateEntries(updated);
  };

  const handleDeleteEntry = (id: string) => {
    if (confirm("Are you sure you want to delete this journal entry?")) {
      onUpdateEntries(entries.filter((e) => e.id !== id));
      if (currentEntry.id === id) {
        setTitleInput("");
        setContentInput("");
        setMoodInput(3);
      }
    }
  };

  const handleApplyPrompt = () => {
    setContentInput(
      (prev) => 
        (prev ? prev + "\n\n" : "") + 
        `Prompt: ${WRITING_PROMPTS[promptIndex]}\n`
    );
    setPromptIndex((prev) => (prev + 1) % WRITING_PROMPTS.length);
  };

  const sortedEntries = [...entries].sort((a, b) => b.date.localeCompare(a.date));

  const filteredEntries = sortedEntries.filter((entry) => {
    const matchesSearch = 
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMood = filterMood === "all" || entry.mood === filterMood;
    return matchesSearch && matchesMood;
  });

  const activeMoodMeta = MOODS.find((m) => m.value === moodInput) || MOODS[2];

  return (
    <div className="space-y-6" id="journal-reflect-panel">
      {/* 1. Daily Entry Creator */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl" />

        <div className="flex items-start justify-between mb-5 select-none">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <PenLine className="w-5 h-5 text-indigo-600" />
              Mindful Journal
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Reflect on your day for{" "}
              <span className="font-mono text-indigo-600 font-extrabold">{selectedDate}</span>.
            </p>
          </div>

          <button
            onClick={handleApplyPrompt}
            type="button"
            className="text-[11px] font-bold text-indigo-700 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition"
            title="Inject a journaling prompt cue"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            Writing Cue
          </button>
        </div>

        <form onSubmit={handleSaveEntry} className="space-y-5">
          {/* Mood Check-In Slider (Visual button group) */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              How is your focus & energy?
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {MOODS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMoodInput(m.value)}
                  className={`py-2 px-1 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                    moodInput === m.value
                      ? `${m.color} ring-2 ring-indigo-500/10 scale-[1.02] font-semibold`
                      : "border-slate-200 hover:border-slate-300 bg-white text-slate-500 hover:text-slate-800"
                  }`}
                  title={m.desc}
                >
                  <span className="text-xl">{m.emoji}</span>
                  <span className="text-[10px] font-bold leading-tight">{m.label}</span>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 mt-2 italic text-center font-medium">
              Aura Status: "{activeMoodMeta.desc}"
            </p>
          </div>

          {/* Title */}
          <div>
            <input
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              placeholder="Title (Optional, e.g., A Break in the Clouds)"
              className="w-full text-sm font-bold py-2.5 px-3.5 bg-white border border-slate-250 focus:border-indigo-600 rounded-xl text-slate-900 placeholder-slate-400 outline-none transition"
            />
          </div>

          {/* Prompt Suggestion Overlay inside textarea */}
          <div className="relative">
            <textarea
              value={contentInput}
              onChange={(e) => setContentInput(e.target.value)}
              placeholder="Start reflecting, tracking mental states, or listing blocks... What went well? What challenged you?"
              rows={4}
              className="w-full text-sm py-3 px-3.5 bg-white border border-slate-250 focus:border-indigo-600 rounded-xl text-slate-900 placeholder-slate-400 outline-none focus:outline-none resize-none transition"
              required
            />
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="submit"
              disabled={!contentInput.trim()}
              className={`text-xs px-4.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 ${
                contentInput.trim()
                  ? "bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer shadow-sm"
                  : "bg-slate-100 text-slate-350 cursor-not-allowed"
              }`}
            >
              Commit Log
            </button>
          </div>
        </form>
      </div>

      {/* 2. Journal History & Search */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
          <BookOpen className="w-4 h-4 text-slate-400" />
          Reflective Archives ({entries.length})
        </h3>

        {/* Search & Mood filter */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-grow">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search archives..."
              className="w-full text-xs py-2.5 pl-9 pr-3 bg-white border border-slate-250 focus:border-indigo-600 rounded-xl text-slate-900 placeholder-slate-400 outline-none transition"
            />
          </div>

          <select
            value={filterMood}
            onChange={(e) => setFilterMood(e.target.value === "all" ? "all" : parseInt(e.target.value))}
            className="bg-white text-xs border border-slate-250 text-slate-600 focus:border-indigo-600 rounded-xl py-2 px-3 outline-none transition"
          >
            <option value="all">All Moods</option>
            {MOODS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.emoji} {m.label}
              </option>
            ))}
          </select>
        </div>

        {/* Entries list */}
        {filteredEntries.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-slate-200 rounded-2xl">
            <Calendar className="w-7 h-7 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-bold">No archived entries match criteria.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {filteredEntries.map((entry) => {
              const mMeta = MOODS.find((m) => m.value === entry.mood) || MOODS[2];
              return (
                <div
                  key={entry.date}
                  className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100 hover:border-slate-200 transition relative group"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg" title={mMeta.label}>
                        {mMeta.emoji}
                      </span>
                      <h4 className="text-xs font-bold text-slate-800 truncate max-w-[140px]">
                        {entry.title || "Archive Log"}
                      </h4>
                    </div>
                    <span className="text-[9px] font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg">
                      {entry.date}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 pr-4">{entry.content}</p>

                  {/* Absolute hovering delete */}
                  <button
                    onClick={() => handleDeleteEntry(entry.id)}
                    className="absolute right-2.5 bottom-2.5 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition"
                    title="Delete journal entry"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
