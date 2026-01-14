export interface BlogArticle {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  author: string;
  imageUrl?: string;
}

export interface RiskAssessment {
  score: number;
  threatLevel: "Low" | "Medium" | "High" | "Critical";
  summary: string;
  reasoning: string;
  actionSteps: string[];
}

export interface PhishingChallenge {
  url: string;
  isPhishing: boolean;
  explanation: string;
  label: string;
}

export enum Page {
  Home = "home",
  Detect = "detect",
  Blog = "blog",
  Lab = "lab",
  About = "about",
}
