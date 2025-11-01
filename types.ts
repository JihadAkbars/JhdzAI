
export enum Sender {
  User = 'user',
  AI = 'ai',
  System = 'system',
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
  maps?: {
    uri: string;
    title: string;
    placeAnswerSources?: {
      reviewSnippets?: {
        uri: string;
        text: string;
      }[];
    }
  }
}

export interface ChatMessage {
  id: string;
  sender: Sender;
  text: string;
  image?: string; // base64 image
  video?: string; // base64 video preview
  audio?: string; // base64 audio
  sources?: GroundingChunk[];
}

export type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4";

export enum Feature {
  Chat = 'Chat',
  ImageGen = 'Image Generation',
  ImageEdit = 'Image Editing',
  VideoGen = 'Video Generation',
  Live = 'Live Conversation',
}
