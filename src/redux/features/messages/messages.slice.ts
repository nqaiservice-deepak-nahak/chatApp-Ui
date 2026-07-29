import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppApiResponse, ChatMessage } from '../../../@types';
import API from '../../../config/axios.config';
import { API_ENDPOINTS } from '../../../shared/api-endpoints';

interface MessagesState {
  chatHistory: ChatMessage[];
  privateChatHistory: ChatMessage[];
  historyLoading: boolean;
  error: string | null;
}

const initialState: MessagesState = {
  chatHistory: [],
  privateChatHistory: [],
  historyLoading: false,
  error: null
};

//#region Thunks
export const fetchChatHistoryThunk = createAsyncThunk('messages/fetchHistory', async (groupId: string, { rejectWithValue }) => {
  try {
    const res = await API.get<AppApiResponse<ChatMessage[]>>(API_ENDPOINTS.CHAT_HISTORY(groupId));
    return res.data.data || [];
  } catch (error: any) {
    return rejectWithValue(error?.response?.data?.message || 'Failed to load messages.');
  }
});

export const fetchPrivateChatHistoryThunk = createAsyncThunk('messages/fetchPrivateHistory', async (userId: string, { rejectWithValue }) => {
  try {
    const res = await API.get<AppApiResponse<ChatMessage[]>>(API_ENDPOINTS.PRIVATE_CHAT_HISTORY(userId));
    return res.data.data || [];
  } catch (error: any) {
    return rejectWithValue(error?.response?.data?.message || 'Failed to load this conversation.');
  }
});
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
    },
    clearPrivateChatHistory: (state) => {
      state.privateChatHistory = [];
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChatHistoryThunk.pending, (state) => {
        state.historyLoading = true;
        state.error = null;
      })
      .addCase(fetchChatHistoryThunk.fulfilled, (state, action) => {
        state.historyLoading = false;
        state.chatHistory = action.payload;
      })
      .addCase(fetchChatHistoryThunk.rejected, (state, action: PayloadAction<any>) => {
        state.historyLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchPrivateChatHistoryThunk.pending, (state) => {
        state.historyLoading = true;
        state.error = null;
        state.privateChatHistory = [];
      })
      .addCase(fetchPrivateChatHistoryThunk.fulfilled, (state, action) => {
        state.historyLoading = false;
        state.privateChatHistory = action.payload;
      })
      .addCase(fetchPrivateChatHistoryThunk.rejected, (state, action: PayloadAction<any>) => {
        state.historyLoading = false;
        state.error = action.payload;
      });
  }
});

export const { appendMessage, appendPrivateMessage, clearChatHistory, clearPrivateChatHistory } = messagesSlice.actions;
export const messagesReducer = messagesSlice.reducer;
