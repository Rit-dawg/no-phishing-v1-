
import { GoogleGenAI, Type } from "@google/genai";
import { BlogArticle } from "../types";

// Update this to your actual Directus URL
export const CMS_API_URL = "https://your-project-id.directus.app"; 

export const getGeminiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY is not defined in the environment.");
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Checks if a user is an admin by querying the Directus 'admins' collection
 */
export const checkAdminStatus = async (email: string): Promise<boolean> => {
  const HARDCODED_ADMIN = "needogra2016@Gmail.com";
  const normalizedEmail = email.toLowerCase().trim();
  
  if (normalizedEmail === HARDCODED_ADMIN.toLowerCase().trim()) return true;

  if (CMS_API_URL && !CMS_API_URL.includes("your-project-id")) {
    try {
      const response = await fetch(`${CMS_API_URL}/items/admins?filter[email][_eq]=${normalizedEmail}`);
      const data = await response.json();
      return !!(data?.data && data.data.length > 0);
    } catch (e) {
      console.error("Directus admin check failed:", e);
      return false;
    }
  }
  return false;
};

/**
 * Fetches page content (like About Us) from Directus
 */
export const fetchAboutPage = async () => {
  if (CMS_API_URL && !CMS_API_URL.includes("your-project-id")) {
    try {
      const response = await fetch(`${CMS_API_URL}/items/pages?filter[slug][_eq]=about`);
      const data = await response.json();
      if (data?.data?.[0]) return data.data[0];
    } catch (e) {
      console.warn("Directus page fetch failed, using fallback.");
    }
  }
  return {
    title: "Our Mission & Expertise",
    content: "No-Phishing was founded by security professionals and AI researchers to bridge the gap between complex cyber-forensics and everyday digital life. We leverage state-of-the-art LLMs to provide instant, actionable intelligence on suspicious interactions."
  };
};

/**
 * Fetches articles from Directus or generates them with Gemini if Directus is unavailable
 */
export const generateBlogArticles = async (): Promise<BlogArticle[]> => {
  if (CMS_API_URL && !CMS_API_URL.includes("your-project-id")) {
    try {
      const response = await fetch(`${CMS_API_URL}/items/articles?sort=-date&limit=10`);
      const data = await response.json();
      if (data?.data && data.data.length > 0) {
        return data.data.map((item: any) => ({
          id: item.id.toString(),
          title: item.title,
          excerpt: item.excerpt,
          content: item.content,
          date: new Date(item.date || Date.now()).toLocaleDateString(),
          author: item.author || "Security Council"
        }));
      }
    } catch (e) {
      console.warn("Directus articles fetch failed, falling back to AI generation.");
    }
  }

  // Fallback: AI Generation
  const ai = getGeminiClient();
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
 * Performs situational analysis using Google Search grounding
 */
export const analyzeSituation = async (context: string) => {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze this potential scam scenario: "${context}". Determine a risk score (0-100), threat level, summary, and action steps.`,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          threatLevel: { type: Type.STRING },
          summary: { type: Type.STRING },
          actionSteps: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["score", "threatLevel", "summary", "actionSteps"]
      }
    }
  });
  return JSON.parse(response.text || "{}");
};

/**
 * AI Drafting for Admin Panel and optional save to Directus
 */
export const draftArticleWithAI = async (topic: string, points: string) => {
  const ai = getGeminiClient();
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
  
  const articleDraft = JSON.parse(response.text || "{}");

  // OPTIONAL: Auto-save to Directus if configured
  if (CMS_API_URL && !CMS_API_URL.includes("your-project-id")) {
    try {
      await fetch(`${CMS_API_URL}/items/articles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...articleDraft,
          date: new Date().toISOString(),
          status: 'published'
        })
      });
    } catch (e) {
      console.error("Failed to save draft to Directus:", e);
    }
  }

  return articleDraft;
};
