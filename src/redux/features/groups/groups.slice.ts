import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppApiResponse, Group } from '../../../@types';
import API from '../../../config/axios.config';
import { API_ENDPOINTS } from '../../../shared/api-endpoints';

interface GroupsState {
  myGroups: Group[];
  availableGroups: Group[];
  groupDetails: Group | null;
  listLoading: boolean;
  createLoading: boolean;
  detailsLoading: boolean;
  joinLoading: boolean;
  deleteLoading: boolean;
  error: string | null;
}

const initialState: GroupsState = {
  myGroups: [],
  availableGroups: [],
  groupDetails: null,
  listLoading: false,
  createLoading: false,
  detailsLoading: false,
  joinLoading: false,
  deleteLoading: false,
  error: null
};

//#region Thunks
export const fetchMyGroupsThunk = createAsyncThunk('groups/fetchMy', async (_: void, { rejectWithValue }) => {
  try {
    const res = await API.get<AppApiResponse<Group[]>>(API_ENDPOINTS.MY_GROUPS);
    return res.data.data || [];
  } catch (error: any) {
    return rejectWithValue(error?.response?.data?.message || 'Failed to load your groups.');
  }
});

export const fetchAvailableGroupsThunk = createAsyncThunk('groups/fetchAvailable', async (_: void, { rejectWithValue }) => {
  try {
    const res = await API.get<AppApiResponse<Group[]>>(API_ENDPOINTS.AVAILABLE_GROUPS);
    return res.data.data || [];
  } catch (error: any) {
    return rejectWithValue(error?.response?.data?.message || 'Failed to load available groups.');
  }
});

export const createGroupThunk = createAsyncThunk(
  'groups/create',
  async (body: { name: string; description?: string }, { rejectWithValue }) => {
    try {
      const res = await API.post<AppApiResponse<Group>>(API_ENDPOINTS.CREATE_GROUP, body);
      return res.data.data!;
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.message || 'Failed to create group.');
    }
  }
);

export const fetchGroupDetailsThunk = createAsyncThunk('groups/fetchDetails', async (groupId: string, { rejectWithValue }) => {
  try {
    const res = await API.get<AppApiResponse<Group>>(API_ENDPOINTS.GROUP_DETAILS(groupId));
    return res.data.data!;
  } catch (error: any) {
    return rejectWithValue(error?.response?.data?.message || 'Failed to load group details.');
  }
});

export const joinGroupThunk = createAsyncThunk('groups/join', async (groupId: string, { rejectWithValue }) => {
  try {
    await API.post(API_ENDPOINTS.JOIN_GROUP(groupId));
    return groupId;
  } catch (error: any) {
    return rejectWithValue(error?.response?.data?.message || 'Failed to join group.');
  }
});

export const deleteGroupThunk = createAsyncThunk('groups/delete', async (groupId: string, { rejectWithValue }) => {
  try {
    await API.delete(API_ENDPOINTS.DELETE_GROUP(groupId));
    return groupId;
  } catch (error: any) {
    return rejectWithValue(error?.response?.data?.message || 'Failed to delete group.');
  }
});
//#endregion Thunks

const groupsSlice = createSlice({
  name: 'groups',
  initialState,
  reducers: {
    clearGroupsError: (state) => {
      state.error = null;
    },
    clearGroupDetails: (state) => {
      state.groupDetails = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyGroupsThunk.pending, (state) => {
        state.listLoading = true;
      })
      .addCase(fetchMyGroupsThunk.fulfilled, (state, action) => {
        state.listLoading = false;
        state.myGroups = action.payload;
      })
      .addCase(fetchMyGroupsThunk.rejected, (state, action: PayloadAction<any>) => {
        state.listLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchAvailableGroupsThunk.fulfilled, (state, action) => {
        state.availableGroups = action.payload;
      })
      .addCase(fetchAvailableGroupsThunk.rejected, (state, action: PayloadAction<any>) => {
        state.error = action.payload;
      })
      .addCase(createGroupThunk.pending, (state) => {
        state.createLoading = true;
        state.error = null;
      })
      .addCase(createGroupThunk.fulfilled, (state, action) => {
        state.createLoading = false;
        state.myGroups = [action.payload, ...state.myGroups];
      })
      .addCase(createGroupThunk.rejected, (state, action: PayloadAction<any>) => {
        state.createLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchGroupDetailsThunk.pending, (state) => {
        state.detailsLoading = true;
        state.error = null;
      })
      .addCase(fetchGroupDetailsThunk.fulfilled, (state, action) => {
        state.detailsLoading = false;
        state.groupDetails = action.payload;
      })
      .addCase(fetchGroupDetailsThunk.rejected, (state, action: PayloadAction<any>) => {
        state.detailsLoading = false;
        state.error = action.payload;
      })
      .addCase(joinGroupThunk.pending, (state) => {
        state.joinLoading = true;
        state.error = null;
      })
      .addCase(joinGroupThunk.fulfilled, (state) => {
        state.joinLoading = false;
      })
      .addCase(joinGroupThunk.rejected, (state, action: PayloadAction<any>) => {
        state.joinLoading = false;
        state.error = action.payload;
      })
      .addCase(deleteGroupThunk.pending, (state) => {
        state.deleteLoading = true;
        state.error = null;
      })
      .addCase(deleteGroupThunk.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.myGroups = state.myGroups.filter((group) => group._id !== action.payload);
        state.availableGroups = state.availableGroups.filter((group) => group._id !== action.payload);
        if (state.groupDetails?._id === action.payload) {
          state.groupDetails = null;
        }
      })
      .addCase(deleteGroupThunk.rejected, (state, action: PayloadAction<any>) => {
        state.deleteLoading = false;
        state.error = action.payload;
      });
  }
});

export const { clearGroupsError, clearGroupDetails } = groupsSlice.actions;
export const groupsReducer = groupsSlice.reducer;
