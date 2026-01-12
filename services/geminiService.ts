
import { GoogleGenAI, Type } from "@google/genai";
import { BlogArticle } from "../types";

export const CMS_API_URL = "https://your-project-id.directus.app"; 

export const getGeminiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY is not defined in the environment.");
  }
  return new GoogleGenAI({ apiKey });
};

export const checkAdminStatus = async (email: string): Promise<boolean> => {
  const HARDCODED_ADMIN = "needogra2016@Gmail.com";
  const normalizedEmail = email.toLowerCase().trim();
  if (normalizedEmail === HARDCODED_ADMIN.toLowerCase().trim()) return true;
  return false;
};

export const fetchAboutPage = async () => {
  return {
    title: "Our Mission & Expertise",
    content: "No-Phishing was founded by security professionals and AI researchers to bridge the gap between complex cyber-forensics and everyday digital life. We leverage state-of-the-art LLMs to provide instant, actionable intelligence on suspicious interactions."
  };
};

export const generateBlogArticles = async (): Promise<BlogArticle[]> => {
  const ai = getGeminiClient();
  // Using gemini-3-flash-preview for general text tasks
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: "Generate 3 professional cyber-security whitepapers on phishing trends for adults. Return JSON array of objects with id, title, excerpt, content, date, author.",
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

/**
 * Performs situational analysis using Google Search grounding and Multi-modal input
 * Now includes forensic reasoning for transparency.
 */
export const analyzeSituation = async (context: string, imageData?: { data: string, mimeType: string }) => {
  const ai = getGeminiClient();
  
  const parts: any[] = [{ text: `Analyze this potential scam scenario: "${context}". 
  If an image is provided, perform Visual Forensics to detect UI anomalies, mismatched URLs, or suspicious branding. 
  
  CRITICAL: You must provide a 'reasoning' section explaining EXACTLY how you reached your conclusion, citing specific patterns, psychological tactics, or technical inconsistencies found.
  
  Determine a risk score (0-100), threat level, summary, forensic reasoning, and action steps.` }];
  
  if (imageData) {
    parts.push({
      inlineData: {
        data: imageData.data,
        mimeType: imageData.mimeType
      }
    });
  }

  // Using gemini-3-flash-preview for general text analysis tasks
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
          reasoning: { type: Type.STRING, description: "Detailed forensic explanation of how the model reached this risk score." },
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
  // Using gemini-3-flash-preview for simple drafting tasks
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Draft a professional security advisory about "${topic}". Points to include: ${points}.`,
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
