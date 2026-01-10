
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
  threatLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  summary: string;
  actionSteps: string[];
}

export enum Page {
  Home = 'home',
  Detect = 'detect',
  Blog = 'blog',
  Education = 'education',
  Recovery = 'recovery',
  Privacy = 'privacy',
  Terms = 'terms',
  Ethics = 'ethics',
  About = 'about',
  Admin = 'admin'
}
