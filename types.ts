export enum UserType {
  STANDARD = 'STANDARD',
  PREMIUM = 'PREMIUM',
}

export interface User {
  id: string;
  name: string;
  email: string;
  type: UserType;
  avatarUrl?: string;
}

export interface ProfileCard {
  id: string;
  userId: string;
  fullName: string;
  pronunciationAudioUrl?: string;
  phoneticText?: string;
  photoUrl: string;
  shortBio?: string;
  nationality?: string;
  funFact?: string;
  links?: string[];
}

export interface Group {
  id: string;
  name: string;
  description: string;
  createdByUserId: string;
  isPublic: boolean;
  joinCode: string;
}

export interface Membership {
  id: string;
  groupId: string;
  userId: string;
}

export interface CardStatus {
  id: string;
  viewerUserId: string;
  profileCardId: string;
  groupId: string;
  isKnown: boolean;
  lastReviewedAt: number; // timestamp
}

export interface DeckFilter {
  status: 'ALL' | 'KNOWN' | 'UNKNOWN';
}

// AI / Chat Types

export enum Role {
  USER = 'user',
  MODEL = 'model',
}

export interface Attachment {
  mimeType: string;
  data: string; // base64
  name?: string;
}

export interface GroundingChunk {
    web?: {
        uri: string;
        title: string;
    };
}

export interface Message {
  role: Role;
  text: string;
  attachments?: Attachment[];
  groundingChunks?: GroundingChunk[];
}

export interface ModelConfig {
  modelId: string;
  useSearch: boolean;
  thinkingBudget: number;
}

export const DEFAULT_CONFIG: ModelConfig = {
  modelId: 'gemini-2.5-flash',
  useSearch: false,
  thinkingBudget: 0,
};
