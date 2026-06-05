import express, { Request, Response } from "express";
import { GoogleGenAI, Type } from "@google/genai";

const app = express();
app.use(express.json());

// Lazy-loaded Gemini AI client to ensure startup is resilient even if API key is not yet set
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing. Please configure it in the Secrets panel.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// 1. API routes FIRST
app.post("/api/insights", async (req: Request, res: Response): Promise<void> => {
  try {
    const { habits, journalEntries } = req.body;

    if (!habits || !journalEntries) {
      res.status(400).json({ error: "Missing habits or journal entries payload" });
      return;
    }

    const ai = getGenAI();

    const systemInstruction = 
      "You are 'Aura', a warm, deeply perceptive personal development coach and holistic wellness analyst. " +
      "You analyze a person's completed habits and daily reflective journal logs over the past week. " +
      "You connect habits, mood scores, and writing to deliver precise, actionable, human-centered coaching insights in JSON format. " +
      "Avoid clinical jargon, corporate speech, and robotic lists. Keep advice grounded, empathetic, and highly specific to their logging trends.";

    const prompt = 
      `Analyze the following self-improvement tracker data. Find patterns between their mood scores (1-5 where 5 is excellent) and their daily habit achievements.\n\n` +
      `Daily Habits Status:\n${JSON.stringify(habits, null, 2)}\n\n` +
      `Daily Journal and Mood Logs:\n${JSON.stringify(journalEntries, null, 2)}\n\n` +
      `Identify trends, highlight highlights/blindspots, and complete the analysis strictly matching the requested JSON output format.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallMood: {
              type: Type.STRING,
              description: "A short descriptive phrase summarizing their recent emotional state and focus (e.g., 'Resilient & Focused', 'Reflective & Quietly Building')."
            },
            sentimentScore: {
              type: Type.INTEGER,
              description: "An overall satisfaction/positivity score from 0 (very low, stressed, stagnant) to 100 (high fulfillment, energy, consistency)."
            },
            bulletAdvice: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Exactly 3 highly customized, deeply personal actionable tips linking habit success directly to wellness/mood. Mention specific journal thoughts or habits."
            },
            encouragement: {
              type: Type.STRING,
              description: "A warm, deeply supportive, direct sentence of emotional encouragement."
            },
            challenge: {
              type: Type.STRING,
              description: "One actionable, clear, micro-challenge for tomorrow (e.g., 'Drink a full glass of water before looking at any screens')."
            },
            focusWord: {
              type: Type.STRING,
              description: "A single, highly relevant, empowering focus word for their current chapter."
            }
          },
          required: ["overallMood", "sentimentScore", "bulletAdvice", "encouragement", "challenge", "focusWord"]
        }
      }
    });

    const textOutput = response.text;
    if (!textOutput) {
      throw new Error("Empty response returned from the model");
    }

    const insights = JSON.parse(textOutput.trim());
    res.json({ insights });
  } catch (err: any) {
    console.error("Gemini Insights generation error:", err);
    res.status(500).json({ 
      error: "Could not generate insights", 
      details: err.message || err.toString() 
    });
  }
});

export default app;
