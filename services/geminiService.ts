import { GoogleGenAI, Type } from "@google/genai";
import { BlogArticle, PhishingChallenge } from "../types";

export const getGeminiClient = () => {
  // Vite injects the key via 'define' into process.env.API_KEY
  // or via import.meta.env.VITE_API_KEY if defined in .env
  const apiKey =
    (typeof process !== "undefined" && process.env?.API_KEY) ||
    (import.meta as any).env?.VITE_API_KEY;

  if (!apiKey || apiKey === "") {
    console.warn(
      "API_KEY not found in process.env or import.meta.env. Retrying with direct access check.",
    );
  }

  // Final fallback to process.env.API_KEY which is most likely where it's defined
  const finalKey =
    apiKey || (typeof process !== "undefined" ? process.env.API_KEY : "");

  if (!finalKey) {
    throw new Error(
      "No connectivity: Forensic engine requires a valid API key.",
    );
  }

  return new GoogleGenAI({ apiKey: finalKey });
};

export const fetchAdvisories = async (): Promise<BlogArticle[]> => {
  try {
    return await generateBlogArticles();
  } catch (err) {
    console.error("Content fetch failed", err);
    return [];
  }
};

export const generateLabChallenges = async (): Promise<PhishingChallenge[]> => {
  try {
    const ai = getGeminiClient();
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
    return JSON.parse(response.text || "[]");
  } catch (err) {
    console.error("Lab generation error:", err);
    return [];
  }
};

export const generateBlogArticles = async (): Promise<BlogArticle[]> => {
  try {
    const ai = getGeminiClient();
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
    return JSON.parse(response.text || "[]");
  } catch (err) {
    console.error("Blog generation error:", err);
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
      text: `Perform deep forensic analysis on the following situation: "${context}".
  Evaluate linguistic cues, urgency markers, and technical red flags.
  If an image is provided, analyze the visual elements for spoofing or inconsistencies.

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

  if (!response.text) throw new Error("EMPTY_RESPONSE");
  return JSON.parse(response.text);
};
