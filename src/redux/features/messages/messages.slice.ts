import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppApiResponse, ChatMessage } from '../../../@types';
import API from '../../../config/axios.config';
import { API_ENDPOINTS } from '../../../shared/api-endpoints';

interface MessagesState {
  chatHistory: ChatMessage[];
  historyLoading: boolean;
  error: string | null;
}

const initialState: MessagesState = {
  chatHistory: [],
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
//#endregion Thunks

const messagesSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    appendMessage: (state, action: PayloadAction<ChatMessage>) => {
      state.chatHistory.push(action.payload);
    },
    clearChatHistory: (state) => {
      state.chatHistory = [];
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
      });
  }
});

export const { appendMessage, clearChatHistory } = messagesSlice.actions;
export const messagesReducer = messagesSlice.reducer;
