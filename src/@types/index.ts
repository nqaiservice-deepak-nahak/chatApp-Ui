export interface User {
  id: string;
  name: string;
  email: string;
  createdOn?: string;
}

export type GroupType = 'public' | 'private';

export interface Group {
  _id: string;
  name: string;
  description?: string;
  type: GroupType;
  createdBy: string;
  createdByName: string;
  createdOn: string;
  joinedAt?: string | null;
  lastReadAt?: string | null;
  totalMembers?: number;
  isMember?: boolean;
  unreadCount?: number;
  unreadPreview?: EncryptedChatMessage[];
  lastMessage?: Pick<EncryptedChatMessage, 'message' | 'createdOn'> | null;
}

export interface MessageContent {
  text: string;
}

export interface EncryptedChatMessage {
  _id: string;
  chatId: string;
  groupId?: string;
  receiverId?: string;
  senderId: string;
  senderName: string;
  message: string;
  messageType?: 'group' | 'private' | 'system';
  createdOn: string;
}

export interface ChatMessage {
  _id: string;
  chatId: string;
  groupId?: string;
  receiverId?: string;
  senderId: string;
  senderName: string;
  message: string;
  messageType?: 'group' | 'private' | 'system';
  createdOn: string;
}

export interface MemberAddResult {
  id: string;
  ok: boolean;
  reason?: string;
}

export interface CreateGroupResponse {
  group: Group;
  memberAddSummary: MemberAddResult[];
}

export interface AddMembersResponse {
  added: number;
  results: MemberAddResult[];
}

export interface DirectConversationDetails {
  otherUserId: string;
  otherUserName: string;
  otherUserEmail: string;
}

export interface ChatListItem {
  chatType: 'group' | 'private';
  id: string;
  name: string;
  description?: string | null;
  createdBy?: string | null;
  createdByName?: string | null;
  createdOn?: string | null;
  lastMessagePreview?: string | null;
  lastMessageAt?: string | null;
  unreadCount: number;
  unreadPreview: EncryptedChatMessage[];
  groupDetails?: Group;
  directDetails?: DirectConversationDetails;
}

export interface GroupPresenceMember {
  userId: string;
  userName: string;
  isOnline: boolean;
}

export interface GroupPresence {
  groupId: string;
  activeCount: number;
  members: GroupPresenceMember[];
}

export interface AppApiResponse<T = any> {
  code: number;
  message: string | string[];
  data?: T;
}

export interface PaginatedSearchRequest {
  offset?: number;
  limit?: number;
  searchData?: string;
}

export interface PaginatedResponse<T> {
  totalCount: number;
  offset: number;
  limit: number;
  items: T[];
}
