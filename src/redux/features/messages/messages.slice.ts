import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppApiResponse, ChatMessage } from '../../../@types';
import API from '../../../config/axios.config';
import { API_ENDPOINTS } from '../../../shared/api-endpoints';

const HISTORY_PAGE_SIZE = 50;

interface MessageHistoryPage {
  items: ChatMessage[];
  hasMore: boolean;
  nextOffset: number | null;
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
  chatHistory: ChatMessage[];
  privateChatHistory: ChatMessage[];
  historyLoading: boolean;
  olderHistoryLoading: boolean;
  chatHasMore: boolean;
  chatNextOffset: number | null;
  privateHasMore: boolean;
  privateNextOffset: number | null;
  error: string | null;
}

const initialState: MessagesState = {
  chatHistory: [],
  privateChatHistory: [],
  historyLoading: false,
  olderHistoryLoading: false,
  chatHasMore: false,
  chatNextOffset: null,
  privateHasMore: false,
  privateNextOffset: null,
  error: null
};

const prependUniqueMessages = (current: ChatMessage[], older: ChatMessage[]): ChatMessage[] => {
  const existingIds = new Set(current.map((message) => message._id));
  return [...older.filter((message) => !existingIds.has(message._id)), ...current];
};

//#region Thunks
export const fetchChatHistoryThunk = createAsyncThunk(
  'messages/fetchHistory',
  async ({ groupId, offset = 0 }: GroupHistoryRequest, { rejectWithValue }) => {
    try {
      const res = await API.post<AppApiResponse<MessageHistoryPage>>(API_ENDPOINTS.CHAT_HISTORY, {
        groupId,
        offset,
        limit: HISTORY_PAGE_SIZE
      });
      return { page: res.data.data!, offset };
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.message || 'Failed to load messages.');
    }
  }
);

export const fetchPrivateChatHistoryThunk = createAsyncThunk(
  'messages/fetchPrivateHistory',
  async ({ userId, offset = 0 }: PrivateHistoryRequest, { rejectWithValue }) => {
    try {
      const res = await API.post<AppApiResponse<MessageHistoryPage>>(API_ENDPOINTS.PRIVATE_CHAT_HISTORY, {
        otherUserId: userId,
        offset,
        limit: HISTORY_PAGE_SIZE
      });
      return { page: res.data.data!, offset };
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.message || 'Failed to load this conversation.');
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
    }
  },
  extraReducers: (builder) => {
    builder
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

export const { appendMessage, appendPrivateMessage, clearChatHistory, clearPrivateChatHistory } = messagesSlice.actions;
export const messagesReducer = messagesSlice.reducer;
