import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  AppApiResponse,
  ChatListItem,
  ChatMessage,
  EncryptedChatMessage,
  PaginatedResponse,
  PaginatedSearchRequest
} from '../../../@types';
import API from '../../../config/axios.config';
import { API_ENDPOINTS } from '../../../shared/api-endpoints';
import { normalizeChatMessages } from '../../../shared/message-crypto';

const HISTORY_PAGE_SIZE = 50;

interface WireMessageHistoryPage {
  items: EncryptedChatMessage[];
  hasMore: boolean;
  nextOffset: number | null;
}

interface MessageHistoryPage extends Omit<WireMessageHistoryPage, 'items'> {
  items: ChatMessage[];
}

interface GroupHistoryRequest {
  groupId: string;
  offset?: number;
}

interface PrivateHistoryRequest {
  userId: string;
  offset?: number;
}

interface MessagesState {
  chatList: ChatListItem[];
  chatTotalCount: number;
  chatHistory: ChatMessage[];
  privateChatHistory: ChatMessage[];
  chatsLoading: boolean;
  historyLoading: boolean;
  olderHistoryLoading: boolean;
  chatHasMore: boolean;
  chatNextOffset: number | null;
  privateHasMore: boolean;
  privateNextOffset: number | null;
  error: string | null;
}

const initialState: MessagesState = {
  chatList: [],
  chatTotalCount: 0,
  chatHistory: [],
  privateChatHistory: [],
  chatsLoading: false,
  historyLoading: false,
  olderHistoryLoading: false,
  chatHasMore: false,
  chatNextOffset: null,
  privateHasMore: false,
  privateNextOffset: null,
  error: null
};

const getErrorMessage = (error: any, fallback: string): string => {
  const message = error?.response?.data?.message;
  if (Array.isArray(message)) return message.join(' ');
  return typeof message === 'string' && message.trim() ? message : fallback;
};

const prependUniqueMessages = (current: ChatMessage[], older: ChatMessage[]): ChatMessage[] => {
  const existingIds = new Set(current.map((message) => message._id));
  return [...older.filter((message) => !existingIds.has(message._id)), ...current];
};

const normalizeHistoryPage = async (
  page: WireMessageHistoryPage | undefined
): Promise<MessageHistoryPage> => ({
  items: await normalizeChatMessages(page?.items || []),
  hasMore: Boolean(page?.hasMore),
  nextOffset: page?.nextOffset ?? null
});

//#region Thunks
export const fetchChatsThunk = createAsyncThunk<
  { items: ChatListItem[]; totalCount: number },
  PaginatedSearchRequest | void,
  { rejectValue: string }
>(
  'messages/fetchChats',
  async (options, { rejectWithValue }) => {
    try {
      const res = await API.post<AppApiResponse<PaginatedResponse<ChatListItem>>>(
        API_ENDPOINTS.CHATS,
        options || { offset: 0, limit: 100 }
      );
      const page = res.data.data;
      const items = await Promise.all(
        (page?.items || []).map(async (chat) => ({
          ...chat,
          unreadPreview: await normalizeChatMessages(chat.unreadPreview || [])
        }))
      );
      return { items, totalCount: page?.totalCount ?? items.length };
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, 'Failed to load conversations.'));
    }
  }
);

export const fetchChatHistoryThunk = createAsyncThunk(
  'messages/fetchHistory',
  async ({ groupId, offset = 0 }: GroupHistoryRequest, { rejectWithValue }) => {
    try {
      const res = await API.post<AppApiResponse<WireMessageHistoryPage>>(API_ENDPOINTS.CHAT_HISTORY, {
        groupId,
        offset,
        limit: HISTORY_PAGE_SIZE
      });
      return { page: await normalizeHistoryPage(res.data.data), offset };
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, 'Failed to load messages.'));
    }
  }
);

export const fetchPrivateChatHistoryThunk = createAsyncThunk(
  'messages/fetchPrivateHistory',
  async ({ userId, offset = 0 }: PrivateHistoryRequest, { rejectWithValue }) => {
    try {
      const res = await API.post<AppApiResponse<WireMessageHistoryPage>>(API_ENDPOINTS.PRIVATE_CHAT_HISTORY, {
        otherUserId: userId,
        offset,
        limit: HISTORY_PAGE_SIZE
      });
      return { page: await normalizeHistoryPage(res.data.data), offset };
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, 'Failed to load this conversation.'));
    }
  }
);
//#endregion Thunks

const messagesSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    appendMessage: (state, action: PayloadAction<ChatMessage>) => {
      if (!state.chatHistory.some((message) => message._id === action.payload._id)) {
        state.chatHistory.push(action.payload);
      }
    },
    appendPrivateMessage: (state, action: PayloadAction<ChatMessage>) => {
      if (!state.privateChatHistory.some((message) => message._id === action.payload._id)) {
        state.privateChatHistory.push(action.payload);
      }
    },
    clearChatHistory: (state) => {
      state.chatHistory = [];
      state.chatHasMore = false;
      state.chatNextOffset = null;
    },
    clearPrivateChatHistory: (state) => {
      state.privateChatHistory = [];
      state.privateHasMore = false;
      state.privateNextOffset = null;
    },
    clearMessagesError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChatsThunk.pending, (state) => {
        // Keep real-time refreshes silent once the initial list is visible.
        state.chatsLoading = state.chatList.length === 0;
        state.error = null;
      })
      .addCase(fetchChatsThunk.fulfilled, (state, action) => {
        state.chatsLoading = false;
        state.chatList = action.payload.items;
        state.chatTotalCount = action.payload.totalCount;
      })
      .addCase(fetchChatsThunk.rejected, (state, action: PayloadAction<any>) => {
        state.chatsLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchChatHistoryThunk.pending, (state, action) => {
        const isFirstPage = (action.meta.arg.offset ?? 0) === 0;
        state.historyLoading = isFirstPage;
        state.olderHistoryLoading = !isFirstPage;
        state.error = null;
      })
      .addCase(fetchChatHistoryThunk.fulfilled, (state, action) => {
        state.historyLoading = false;
        state.olderHistoryLoading = false;
        state.chatHistory =
          action.payload.offset === 0
            ? action.payload.page.items
            : prependUniqueMessages(state.chatHistory, action.payload.page.items);
        state.chatHasMore = action.payload.page.hasMore;
        state.chatNextOffset = action.payload.page.nextOffset;
      })
      .addCase(fetchChatHistoryThunk.rejected, (state, action: PayloadAction<any>) => {
        state.historyLoading = false;
        state.olderHistoryLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchPrivateChatHistoryThunk.pending, (state, action) => {
        const isFirstPage = (action.meta.arg.offset ?? 0) === 0;
        state.historyLoading = isFirstPage;
        state.olderHistoryLoading = !isFirstPage;
        state.error = null;
        if (isFirstPage) state.privateChatHistory = [];
      })
      .addCase(fetchPrivateChatHistoryThunk.fulfilled, (state, action) => {
        state.historyLoading = false;
        state.olderHistoryLoading = false;
        state.privateChatHistory =
          action.payload.offset === 0
            ? action.payload.page.items
            : prependUniqueMessages(state.privateChatHistory, action.payload.page.items);
        state.privateHasMore = action.payload.page.hasMore;
        state.privateNextOffset = action.payload.page.nextOffset;
      })
      .addCase(fetchPrivateChatHistoryThunk.rejected, (state, action: PayloadAction<any>) => {
        state.historyLoading = false;
        state.olderHistoryLoading = false;
        state.error = action.payload;
      });
  }
});

export const {
  appendMessage,
  appendPrivateMessage,
  clearChatHistory,
  clearPrivateChatHistory,
  clearMessagesError
} = messagesSlice.actions;
export const messagesReducer = messagesSlice.reducer;
