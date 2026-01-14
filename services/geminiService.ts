
import { GoogleGenAI, Type } from "@google/genai";
import { BlogArticle, PhishingChallenge } from "../types";

// Priority list for model fallbacks
const MODEL_PRIORITY = [
  'gemini-3-flash-preview',
  'gemini-2.5-flash',
  'gemini-flash-lite-latest'
];

export const getGeminiClient = () => {
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    throw new Error("No connectivity: Forensic engine requires a valid API key.");
  }
  
  return new GoogleGenAI({ apiKey });
};

/**
 * Utility to clean AI response text that might contain markdown json blocks
 */
const cleanJsonResponse = (text: string) => {
  return text.replace(/```json/g, '').replace(/```/g, '').trim();
};

/**
 * Robust generation with model fallbacks
 */
async function safeGenerate(promptParts: any[], schema?: any, mimeType: string = "application/json") {
  const ai = getGeminiClient();
  let lastError = null;

  for (const modelName of MODEL_PRIORITY) {
    try {
      const config: any = { responseMimeType: mimeType };
      if (schema) config.responseSchema = schema;

      const response = await ai.models.generateContent({
        model: modelName,
        contents: { parts: promptParts },
        config
      });

      if (response.text) return response.text;
    } catch (err) {
      console.warn(`Model ${modelName} failed, attempting fallback...`);
      lastError = err;
    }
  }
  throw lastError || new Error("All forensic nodes are offline.");
}

export const fetchAdvisories = async (): Promise<BlogArticle[]> => {
  try {
    const schema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          title: { type: Type.STRING },
          excerpt: { type: Type.STRING },
          content: { type: Type.STRING },
          date: { type: Type.STRING },
          author: { type: Type.STRING }
        }
      }
    };
    
    const text = await safeGenerate(
      [{ text: "Generate 3 professional security advisories on phishing trends. Format as valid objects." }],
      schema
    );
    return JSON.parse(cleanJsonResponse(text || "[]"));
  } catch (err) {
    console.error("Content fetch failed", err);
    return [];
  }
};

export const generateLabChallenges = async (): Promise<PhishingChallenge[]> => {
  try {
    const schema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          url: { type: Type.STRING },
          isPhishing: { type: Type.BOOLEAN },
          explanation: { type: Type.STRING },
          label: { type: Type.STRING }
        },
        propertyOrdering: ["url", "isPhishing", "explanation", "label"]
      }
    };

    const text = await safeGenerate(
      [{ text: "Generate 4 realistic URL identification challenges. Include both phishing (look-alikes) and legitimate URLs. Return JSON array." }],
      schema
    );
    return JSON.parse(cleanJsonResponse(text || "[]"));
  } catch (err) {
    console.error("Lab generation error:", err);
    return [];
  }
};

export const analyzeSituation = async (context: string, imageData?: { data: string, mimeType: string }) => {
  const parts: any[] = [{ text: `Perform deep forensic analysis on the following situation: "${context}". 
  Evaluate linguistic cues, urgency markers, and technical red flags. 
  If an image is provided, analyze the visual elements for spoofing or inconsistencies.
  
  CRITICAL: You must provide a specific "Courses of Action" list. Each action must be a concrete, immediate step the user should take to secure themselves.` }];
  
  if (imageData) {
    parts.push({
      inlineData: {
        data: imageData.data,
        mimeType: imageData.mimeType
      }
    });
  }

  const schema = {
    type: Type.OBJECT,
    properties: {
      score: { type: Type.NUMBER },
      threatLevel: { type: Type.STRING },
      summary: { type: Type.STRING },
      reasoning: { type: Type.STRING },
      actionSteps: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["score", "threatLevel", "summary", "reasoning", "actionSteps"]
  };

  try {
    const text = await safeGenerate(parts, schema);
    return JSON.parse(cleanJsonResponse(text));
  } catch (error: any) {
    console.error("Analysis Error:", error);
    throw error;
  }
};
