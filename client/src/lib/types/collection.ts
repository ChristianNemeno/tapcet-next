import type { QuizSummary } from "./quiz";

export interface CollectionSummary {
  id: string;
  title: string;
  description: string;
  examTag: string | null;
  isOfficial: boolean;
  visibility: "public" | "draft";
  quizCount: number;
  followerCount: number;
  creatorName: string | null;
  createdAt: string;
}

export interface CollectionDetail extends CollectionSummary {
  createdBy: string;
  isFollowing: boolean;
  quizzes: Array<QuizSummary & { orderIndex: number }>;
}

export interface MyCollectionSummary {
  id: string;
  title: string;
  description: string;
  examTag: string | null;
  isOfficial: boolean;
  visibility: "public" | "draft";
  quizCount: number;
  createdAt: string;
}

export interface CollectionFormPayload {
  title: string;
  description: string;
  examTag?: string | null;
  visibility: "public" | "draft";
  isOfficial?: boolean;
}
