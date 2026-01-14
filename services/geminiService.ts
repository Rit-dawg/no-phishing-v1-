import { GoogleGenAI, Type } from "@google/genai";
import { BlogArticle } from "../types";

export const getGeminiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY is not defined in the environment.");
  }
  return new GoogleGenAI({ apiKey });
};

export const checkAdminStatus = async (email: string): Promise<boolean> => {
  const hardcodedAdmin = process.env.ADMIN_HARDCODED || "";
  if (!hardcodedAdmin || !email) return false;
  return email.toLowerCase().trim() === hardcodedAdmin.toLowerCase().trim();
};

export const generateBlogArticles = async (): Promise<BlogArticle[]> => {
  try {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents:
        "Generate 3 professional security advisories on phishing trends. Return JSON array with id, title, excerpt, content, date, author.",
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
            propertyOrdering: [
              "id",
              "title",
              "excerpt",
              "content",
              "date",
              "author",
            ],
          },
        },
      },
    });
    // Use .text property directly
    return JSON.parse(response.text || "[]");
  } catch (err) {
    console.error("Error generating articles:", err);
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
      text: `High-fidelity forensic analysis required for: "${context}".
  If image provided, perform Visual Forensics. Use Google Search to verify any entities, phone numbers, or URLs mentioned.
  Structure response as JSON: score (0-100), threatLevel, summary, reasoning, actionSteps.`,
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
    model: "gemini-3-flash-preview",
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
        propertyOrdering: [
          "score",
          "threatLevel",
          "summary",
          "reasoning",
          "actionSteps",
        ],
      },
    },
  });
  // Use .text property directly
  return JSON.parse(response.text || "{}");
};
