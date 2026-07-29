export interface User {
  id: string;
  name: string;
  email: string;
  createdOn?: string;
}

export interface Group {
  _id: string;
  name: string;
  description?: string;
  createdBy: string;
  createdByName: string;
  createdOn: string;
  joinedAt?: string | null;
  totalMembers?: number;
  isMember?: boolean;
}

export interface ChatMessage {
  _id: string;
  groupId: string;
  senderId: string;
  senderName: string;
  message: string;
  createdOn: string;
}

export interface AppApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
}
