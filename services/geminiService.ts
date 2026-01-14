import { GoogleGenAI, Type } from "@google/genai";
import { BlogArticle, PhishingChallenge } from "../types";

// The DIY CMS writes to the 'content' folder in your repo.
// For the live site, we fetch these as static assets relative to the root.
const CONTENT_PATH = "./content";

export const getGeminiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY is not defined.");
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Fetches advisories managed by the DIY CMS.
 * In a real deployment, these are static .md files.
 * We assume a naming convention or a manifest, but for this DIY setup,
 * we'll use the AI fallback if local files aren't found,
 * or you can provide a list of known files.
 */
export const fetchAdvisories = async (): Promise<BlogArticle[]> => {
  try {
    // In a standard GitHub Pages build, these files will be available at /content/name.md
    // However, since we don't have a database, we'll use a hybrid approach:
    // Try to fetch a list (if you have a manifest.json) or just use the generator for now
    // until the user has committed real files to their repo.
    return await generateBlogArticles();
  } catch (err) {
    console.error("Content fetch failed", err);
    return [];
  }
};

export const generateLabChallenges = async (): Promise<PhishingChallenge[]> => {
  try {
    const ai = getGeminiClient();
    // Fixed: Using gemini-3-flash-preview as per task type recommendations
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents:
        "Generate 4 realistic URL identification challenges. Include both phishing (look-alikes) and legitimate URLs. Return JSON array.",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              url: { type: Type.STRING },
              isPhishing: { type: Type.BOOLEAN },
              explanation: { type: Type.STRING },
              label: { type: Type.STRING },
            },
            propertyOrdering: ["url", "isPhishing", "explanation", "label"],
          },
        },
      },
    });
    // Fixed: Access response.text directly (property, not method)
    return JSON.parse(response.text || "[]");
  } catch (err) {
    return [];
  }
};

export const generateBlogArticles = async (): Promise<BlogArticle[]> => {
  try {
    const ai = getGeminiClient();
    // Fixed: Using gemini-3-flash-preview for summarization/text tasks
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents:
        "Generate 3 professional security advisories on phishing trends. Format as valid objects.",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              excerpt: { type: Type.STRING },
              content: { type: Type.STRING },
              date: { type: Type.STRING },
              author: { type: Type.STRING },
            },
          },
        },
      },
    });
    // Fixed: Access response.text directly
    return JSON.parse(response.text || "[]");
  } catch (err) {
    return [];
  }
};

export const analyzeSituation = async (
  context: string,
  imageData?: { data: string; mimeType: string },
) => {
  const ai = getGeminiClient();
  const parts: any[] = [
    {
      text: `Perform deep forensic analysis on: "${context}". Evaluate linguistic cues, urgency markers, and technical red flags.
  CRITICAL: You must provide a specific "Courses of Action" list. Each action must be a concrete, immediate step the user should take to secure themselves.`,
    },
  ];

  if (imageData) {
    parts.push({
      inlineData: {
        data: imageData.data,
        mimeType: imageData.mimeType,
      },
    });
  }

  // Fixed: Use gemini-3-pro-image-preview for high quality / search tasks
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-image-preview",
    contents: { parts },
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          threatLevel: { type: Type.STRING },
          summary: { type: Type.STRING },
          reasoning: { type: Type.STRING },
          actionSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: [
          "score",
          "threatLevel",
          "summary",
          "reasoning",
          "actionSteps",
        ],
      },
    },
  });
  // Fixed: Access response.text directly
  return JSON.parse(response.text || "{}");
};
