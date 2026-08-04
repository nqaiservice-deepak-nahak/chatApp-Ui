import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  AppApiResponse,
  PaginatedResponse,
  PaginatedSearchRequest,
  User
} from '../../../@types';
import API from '../../../config/axios.config';
import { API_ENDPOINTS } from '../../../shared/api-endpoints';
import {
  clearStoredSession,
  getStoredAesKey,
  getStoredRefreshToken,
  getStoredToken,
  getStoredUser,
  setStoredSession
} from '../../../shared/shared-functions';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  aesKey: string | null;
  loginLoading: boolean;
  registerLoading: boolean;
  usersLoading: boolean;
  availableUsers: User[];
  availableUsersTotalCount: number;
  error: string | null;
}

const initialState: AuthState = {
  user: getStoredUser(),
  accessToken: getStoredToken(),
  refreshToken: getStoredRefreshToken(),
  aesKey: getStoredAesKey(),
  loginLoading: false,
  registerLoading: false,
  usersLoading: false,
  availableUsers: [],
  availableUsersTotalCount: 0,
  error: null
};

const getErrorMessage = (error: any, fallback: string): string => {
  const message = error?.response?.data?.message;
  if (Array.isArray(message)) return message.join(' ');
  return typeof message === 'string' && message.trim() ? message : fallback;
};

//#region Thunks
export const registerThunk = createAsyncThunk(
  'auth/register',
  async (body: { name: string; email: string; password: string }, { rejectWithValue }) => {
    try {
      const res = await API.post<AppApiResponse>(API_ENDPOINTS.REGISTER, body);
      return res.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, 'Registration failed. Please try again.'));
    }
  }
);

export const loginThunk = createAsyncThunk('auth/login', async (body: { email: string; password: string }, { rejectWithValue }) => {
  try {
    const res = await API.post<AppApiResponse<{ accessToken: string; refreshToken: string; aesKey: string; user: User }>>(API_ENDPOINTS.LOGIN, body);
    const session = res.data.data;
    if (!session?.accessToken || !session.refreshToken || !session.aesKey || !session.user) {
      return rejectWithValue('The login response did not include a complete secure session.');
    }
    return session;
  } catch (error: any) {
    return rejectWithValue(getErrorMessage(error, 'Invalid email or password.'));
  }
});

export const fetchAvailableUsersThunk = createAsyncThunk<
  PaginatedResponse<User>,
  PaginatedSearchRequest | void,
  { rejectValue: string }
>(
  'auth/fetchAvailableUsers',
  async (options, { rejectWithValue }) => {
    try {
      const res = await API.post<AppApiResponse<PaginatedResponse<User>>>(
        API_ENDPOINTS.AVAILABLE_USERS,
        options || { offset: 0, limit: 100 }
      );
      return res.data.data || { totalCount: 0, offset: 0, limit: 0, items: [] };
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, 'Failed to load people.'));
    }
  }
);
//#endregion Thunks

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      clearStoredSession();
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.aesKey = null;
    },
    clearAuthError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerThunk.pending, (state) => {
        state.registerLoading = true;
        state.error = null;
      })
      .addCase(registerThunk.fulfilled, (state) => {
        state.registerLoading = false;
      })
      .addCase(registerThunk.rejected, (state, action: PayloadAction<any>) => {
        state.registerLoading = false;
        state.error = action.payload;
      })
      .addCase(loginThunk.pending, (state) => {
        state.loginLoading = true;
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.loginLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.aesKey = action.payload.aesKey;
        setStoredSession(action.payload.accessToken, action.payload.refreshToken, action.payload.user, action.payload.aesKey);
      })
      .addCase(loginThunk.rejected, (state, action: PayloadAction<any>) => {
        state.loginLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchAvailableUsersThunk.pending, (state) => {
        state.usersLoading = true;
      })
      .addCase(fetchAvailableUsersThunk.fulfilled, (state, action) => {
        state.usersLoading = false;
        state.availableUsers = action.payload.items;
        state.availableUsersTotalCount = action.payload.totalCount;
      })
      .addCase(fetchAvailableUsersThunk.rejected, (state, action: PayloadAction<any>) => {
        state.usersLoading = false;
        state.error = action.payload;
      });
  }
});

export const { logout, clearAuthError } = authSlice.actions;
export const authReducer = authSlice.reducer;
