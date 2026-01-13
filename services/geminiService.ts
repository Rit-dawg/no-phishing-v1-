
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
  const hardcodedAdmin = process.env.ADMIN_HARDCODED;
  if (!hardcodedAdmin || !email) return false;
  
  const normalizedEmail = email.toLowerCase().trim();
  const normalizedAdmin = hardcodedAdmin.toLowerCase().trim();
  
  return normalizedEmail === normalizedAdmin;
};

export const fetchAboutPage = async () => {
  return {
    title: "Our Mission & Expertise",
    content: "No-Phishing provides professional situational awareness and forensic reasoning to protect global digital assets."
  };
};

export const generateBlogArticles = async (): Promise<BlogArticle[]> => {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: "Generate 3 professional security advisories on phishing trends. Return JSON array with id, title, excerpt, content, date, author.",
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
            author: { type: Type.STRING }
          },
          required: ["id", "title", "excerpt", "content", "date", "author"]
        }
      }
    }
  });
  
  try {
    return JSON.parse(response.text || "[]");
  } catch {
    return [];
  }
};

export const analyzeSituation = async (context: string, imageData?: { data: string, mimeType: string }) => {
  const ai = getGeminiClient();
  
  const parts: any[] = [{ text: `Analyze this potential scam: "${context}". 
  Perform Visual Forensics (if image) and psychological trigger analysis. 
  Explain EXACTLY how you reached your conclusion citing patterns or inconsistencies.
  Determine risk score (0-100), threat level, summary, reasoning, and action steps.` }];
  
  if (imageData) {
    parts.push({
      inlineData: {
        data: imageData.data,
        mimeType: imageData.mimeType
      }
    });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
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
          actionSteps: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["score", "threatLevel", "summary", "reasoning", "actionSteps"]
      }
    }
  });
  return JSON.parse(response.text || "{}");
};

export const draftArticleWithAI = async (topic: string, points: string) => {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Draft a security advisory about "${topic}". Points: ${points}.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          excerpt: { type: Type.STRING },
          content: { type: Type.STRING }
        },
        required: ["title", "excerpt", "content"]
      }
    }
  });
  return JSON.parse(response.text || "{}");
};
