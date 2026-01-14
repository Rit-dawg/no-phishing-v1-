import { GoogleGenAI, Type } from "@google/genai";
import { BlogArticle } from "../types";

export const getGeminiClient = () => {
  // Access the injected process.env.API_KEY
  const apiKey = typeof process !== "undefined" ? process.env.API_KEY : "";
  if (!apiKey) {
    throw new Error(
      "API_KEY is not defined in the environment. Please check your configuration.",
    );
  }
  return new GoogleGenAI({ apiKey });
};

export const checkAdminStatus = async (email: string): Promise<boolean> => {
  const hardcodedAdmin =
    typeof process !== "undefined" ? process.env.ADMIN_HARDCODED : "";
  if (!hardcodedAdmin || !email) return false;

  const normalizedEmail = email.toLowerCase().trim();
  const normalizedAdmin = hardcodedAdmin.toLowerCase().trim();

  return normalizedEmail === normalizedAdmin;
};

export const fetchAboutPage = async () => {
  return {
    title: "Our Mission & Expertise",
    content:
      "No-Phishing provides professional situational awareness and forensic reasoning to protect global digital assets.",
  };
};

export const generateBlogArticles = async (): Promise<BlogArticle[]> => {
  try {
    const ai = getGeminiClient();
    // Using gemini-3-flash-preview for basic text tasks
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
    // Use .text property directly as it returns the string output
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
      text: `Analyze this potential scam: "${context}".
  Perform Visual Forensics (if image) and psychological trigger analysis.
  Explain EXACTLY how you reached your conclusion citing patterns or inconsistencies.
  Determine risk score (0-100), threat level, summary, reasoning, and action steps.`,
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

  // Use gemini-3-pro-preview for complex reasoning and forensic analysis
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: { parts },
    config: {
      // googleSearch is allowed for real-time threat intelligence grounding
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

export const draftArticleWithAI = async (topic: string, points: string) => {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Draft a security advisory about "${topic}". Points: ${points}.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          excerpt: { type: Type.STRING },
          content: { type: Type.STRING },
        },
        propertyOrdering: ["title", "excerpt", "content"],
      },
    },
  });
  // Use .text property directly
  return JSON.parse(response.text || "{}");
};
