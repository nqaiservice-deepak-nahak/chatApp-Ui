import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  AddMembersResponse,
  AppApiResponse,
  CreateGroupResponse,
  Group,
  GroupType,
  MemberAddResult,
  PaginatedResponse,
  PaginatedSearchRequest,
  User
} from '../../../@types';
import API from '../../../config/axios.config';
import { API_ENDPOINTS } from '../../../shared/api-endpoints';

export interface CreateGroupRequest {
  name: string;
  description?: string;
  type?: GroupType;
  memberIds?: string[];
}

export interface GroupMembersRequest {
  groupId: string;
  memberIds: string[];
}

export interface AvailableGroupMembersRequest extends PaginatedSearchRequest {
  groupId: string;
}

export interface TransferGroupOwnershipRequest {
  groupId: string;
  newOwnerUserId: string;
}

interface GroupMembership {
  joinedAt?: string;
  lastReadAt?: string;
}

interface GroupMembersResult extends AddMembersResponse {
  groupId: string;
}

export interface GroupsState {
  myGroups: Group[];
  myGroupsTotalCount: number;
  availableGroups: Group[];
  availableGroupsTotalCount: number;
  searchResults: Group[];
  groupDetails: Group | null;
  availableMembers: User[];
  availableMembersTotalCount: number;
  lastMemberAddSummary: MemberAddResult[];
  listLoading: boolean;
  availableLoading: boolean;
  createLoading: boolean;
  detailsLoading: boolean;
  joinLoading: boolean;
  leaveLoading: boolean;
  deleteLoading: boolean;
  searchLoading: boolean;
  membersLoading: boolean;
  addMembersLoading: boolean;
  transferLoading: boolean;
  markReadLoading: boolean;
  error: string | null;
  availableError: string | null;
  searchError: string | null;
  membersError: string | null;
  addMembersError: string | null;
  transferError: string | null;
  markReadError: string | null;
}

const initialState: GroupsState = {
  myGroups: [],
  myGroupsTotalCount: 0,
  availableGroups: [],
  availableGroupsTotalCount: 0,
  searchResults: [],
  groupDetails: null,
  availableMembers: [],
  availableMembersTotalCount: 0,
  lastMemberAddSummary: [],
  listLoading: false,
  availableLoading: false,
  createLoading: false,
  detailsLoading: false,
  joinLoading: false,
  leaveLoading: false,
  deleteLoading: false,
  searchLoading: false,
  membersLoading: false,
  addMembersLoading: false,
  transferLoading: false,
  markReadLoading: false,
  error: null,
  availableError: null,
  searchError: null,
  membersError: null,
  addMembersError: null,
  transferError: null,
  markReadError: null
};

const getErrorMessage = (error: any, fallback: string): string => {
  const message = error?.response?.data?.message;
  if (Array.isArray(message)) return message.join(' ');
  return typeof message === 'string' && message.trim() ? message : fallback;
};

//#region Thunks
export const fetchMyGroupsThunk = createAsyncThunk<PaginatedResponse<Group>, PaginatedSearchRequest | void, { rejectValue: string }>(
  'groups/fetchMy',
  async (options, { rejectWithValue }) => {
    try {
      const res = await API.post<AppApiResponse<PaginatedResponse<Group>>>(
        API_ENDPOINTS.MY_GROUPS,
        options || { offset: 0, limit: 100 }
      );
      return res.data.data || { totalCount: 0, offset: 0, limit: 0, items: [] };
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, 'Failed to load your groups.'));
    }
  }
);

export const fetchAvailableGroupsThunk = createAsyncThunk<PaginatedResponse<Group>, PaginatedSearchRequest | void, { rejectValue: string }>(
  'groups/fetchAvailable',
  async (options, { rejectWithValue }) => {
    try {
      const res = await API.post<AppApiResponse<PaginatedResponse<Group>>>(
        API_ENDPOINTS.AVAILABLE_GROUPS,
        options || { offset: 0, limit: 100 }
      );
      return res.data.data || { totalCount: 0, offset: 0, limit: 0, items: [] };
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, 'Failed to load available groups.'));
    }
  }
);

export const searchPublicGroupsThunk = createAsyncThunk<Group[], string, { rejectValue: string }>(
  'groups/searchPublic',
  async (searchData, { rejectWithValue }) => {
    try {
      const res = await API.post<AppApiResponse<Group[]>>(API_ENDPOINTS.SEARCH_GROUPS, { searchData });
      return res.data.data || [];
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, 'Failed to search public groups.'));
    }
  }
);

export const createGroupThunk = createAsyncThunk<CreateGroupResponse, CreateGroupRequest, { rejectValue: string }>(
  'groups/create',
  async (body, { rejectWithValue }) => {
    try {
      const res = await API.post<AppApiResponse<CreateGroupResponse>>(API_ENDPOINTS.CREATE_GROUP, body);
      if (!res.data.data?.group) {
        return rejectWithValue('The server returned an invalid group response.');
      }
      return res.data.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, 'Failed to create group.'));
    }
  }
);

export const fetchGroupDetailsThunk = createAsyncThunk<Group, string, { rejectValue: string }>(
  'groups/fetchDetails',
  async (groupId, { rejectWithValue }) => {
    try {
      const res = await API.get<AppApiResponse<Group>>(API_ENDPOINTS.GROUP_DETAILS(groupId));
      if (!res.data.data) return rejectWithValue('The server returned invalid group details.');
      return res.data.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, 'Failed to load group details.'));
    }
  }
);

export const joinGroupThunk = createAsyncThunk<
  { groupId: string; membership?: GroupMembership },
  string,
  { rejectValue: string }
>('groups/join', async (groupId, { rejectWithValue }) => {
  try {
    const res = await API.post<AppApiResponse<GroupMembership>>(API_ENDPOINTS.JOIN_GROUP(groupId));
    return { groupId, membership: res.data.data };
  } catch (error: any) {
    return rejectWithValue(getErrorMessage(error, 'Failed to join group.'));
  }
});

export const fetchAvailableGroupMembersThunk = createAsyncThunk<
  { groupId: string; page: PaginatedResponse<User> },
  AvailableGroupMembersRequest,
  { rejectValue: string }
>('groups/fetchAvailableMembers', async ({ groupId, offset = 0, limit = 100, searchData }, { rejectWithValue }) => {
  try {
    const res = await API.post<AppApiResponse<PaginatedResponse<User>>>(
      API_ENDPOINTS.AVAILABLE_GROUP_MEMBERS(groupId),
      { offset, limit, searchData }
    );
    return {
      groupId,
      page: res.data.data || { totalCount: 0, offset, limit: 0, items: [] }
    };
  } catch (error: any) {
    return rejectWithValue(getErrorMessage(error, 'Failed to load available group members.'));
  }
});

export const addGroupMembersThunk = createAsyncThunk<GroupMembersResult, GroupMembersRequest, { rejectValue: string }>(
  'groups/addMembers',
  async ({ groupId, memberIds }, { rejectWithValue }) => {
    try {
      const res = await API.post<AppApiResponse<AddMembersResponse>>(API_ENDPOINTS.ADD_GROUP_MEMBERS(groupId), { memberIds });
      if (!res.data.data) return rejectWithValue('The server returned an invalid member update.');
      return { groupId, ...res.data.data };
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, 'Failed to add group members.'));
    }
  }
);

export const transferGroupOwnershipThunk = createAsyncThunk<
  Group,
  TransferGroupOwnershipRequest,
  { rejectValue: string }
>('groups/transferOwnership', async ({ groupId, newOwnerUserId }, { rejectWithValue }) => {
  try {
    const res = await API.post<AppApiResponse<Group>>(API_ENDPOINTS.TRANSFER_GROUP_OWNERSHIP(groupId), {
      newOwnerUserId
    });
    if (!res.data.data) return rejectWithValue('The server returned an invalid ownership update.');
    return res.data.data;
  } catch (error: any) {
    return rejectWithValue(getErrorMessage(error, 'Failed to transfer group ownership.'));
  }
});

export const markGroupReadThunk = createAsyncThunk<
  { groupId: string; membership?: GroupMembership },
  string,
  { rejectValue: string }
>('groups/markRead', async (groupId, { rejectWithValue }) => {
  try {
    const res = await API.post<AppApiResponse<GroupMembership>>(API_ENDPOINTS.MARK_GROUP_READ(groupId));
    return { groupId, membership: res.data.data };
  } catch (error: any) {
    return rejectWithValue(getErrorMessage(error, 'Failed to mark the group as read.'));
  }
});

export const deleteGroupThunk = createAsyncThunk<string, string, { rejectValue: string }>(
  'groups/delete',
  async (groupId, { rejectWithValue }) => {
    try {
      const res = await API.delete<AppApiResponse<{ groupId: string }>>(API_ENDPOINTS.DELETE_GROUP(groupId));
      return res.data.data?.groupId || groupId;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, 'Failed to delete group.'));
    }
  }
);

export const leaveGroupThunk = createAsyncThunk<string, string, { rejectValue: string }>(
  'groups/leave',
  async (groupId, { rejectWithValue }) => {
    try {
      await API.delete<AppApiResponse<{ groupId: string }>>(API_ENDPOINTS.LEAVE_GROUP(groupId));
      return groupId;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, 'Failed to leave group.'));
    }
  }
);
//#endregion Thunks

const groupsSlice = createSlice({
  name: 'groups',
  initialState,
  reducers: {
    clearGroupsError: (state) => {
      state.error = null;
      state.availableError = null;
      state.searchError = null;
      state.membersError = null;
      state.addMembersError = null;
      state.transferError = null;
      state.markReadError = null;
    },
    clearGroupDetails: (state) => {
      state.groupDetails = null;
      state.availableMembers = [];
      state.availableMembersTotalCount = 0;
      state.lastMemberAddSummary = [];
      state.membersError = null;
      state.addMembersError = null;
      state.transferError = null;
    },
    clearGroupSearch: (state) => {
      state.searchResults = [];
      state.searchError = null;
    },
    clearGroupMemberErrors: (state) => {
      if (state.error === state.membersError || state.error === state.addMembersError) state.error = null;
      state.membersError = null;
      state.addMembersError = null;
    },
    clearTransferOwnershipError: (state) => {
      if (state.error === state.transferError) state.error = null;
      state.transferError = null;
    },
    resetAvailableMembers: (state) => {
      state.availableMembers = [];
      state.availableMembersTotalCount = 0;
      state.lastMemberAddSummary = [];
      state.membersError = null;
      state.addMembersError = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyGroupsThunk.pending, (state) => {
        state.listLoading = true;
        state.error = null;
      })
      .addCase(fetchMyGroupsThunk.fulfilled, (state, action) => {
        state.listLoading = false;
        state.myGroups = action.payload.items;
        state.myGroupsTotalCount = action.payload.totalCount;
      })
      .addCase(fetchMyGroupsThunk.rejected, (state, action) => {
        state.listLoading = false;
        state.error = action.payload || 'Failed to load your groups.';
      })
      .addCase(fetchAvailableGroupsThunk.pending, (state) => {
        state.availableLoading = true;
        state.availableError = null;
      })
      .addCase(fetchAvailableGroupsThunk.fulfilled, (state, action) => {
        state.availableLoading = false;
        state.availableGroups = action.payload.items;
        state.availableGroupsTotalCount = action.payload.totalCount;
      })
      .addCase(fetchAvailableGroupsThunk.rejected, (state, action) => {
        state.availableLoading = false;
        state.availableError = action.payload || 'Failed to load available groups.';
        state.error = state.availableError;
      })
      .addCase(searchPublicGroupsThunk.pending, (state) => {
        state.searchLoading = true;
        state.searchError = null;
      })
      .addCase(searchPublicGroupsThunk.fulfilled, (state, action) => {
        state.searchLoading = false;
        state.searchResults = action.payload;
      })
      .addCase(searchPublicGroupsThunk.rejected, (state, action) => {
        state.searchLoading = false;
        state.searchError = action.payload || 'Failed to search public groups.';
        state.error = state.searchError;
      })
      .addCase(createGroupThunk.pending, (state) => {
        state.createLoading = true;
        state.error = null;
      })
      .addCase(createGroupThunk.fulfilled, (state, action) => {
        state.createLoading = false;
        const { group, memberAddSummary } = action.payload;
        if (!state.myGroups.some((item) => item._id === group._id)) {
          state.myGroups = [group, ...state.myGroups];
        }
        state.availableGroups = state.availableGroups.filter((item) => item._id !== group._id);
        state.searchResults = state.searchResults.filter((item) => item._id !== group._id);
        state.lastMemberAddSummary = memberAddSummary || [];
      })
      .addCase(createGroupThunk.rejected, (state, action) => {
        state.createLoading = false;
        state.error = action.payload || 'Failed to create group.';
      })
      .addCase(fetchGroupDetailsThunk.pending, (state) => {
        state.detailsLoading = true;
        state.error = null;
      })
      .addCase(fetchGroupDetailsThunk.fulfilled, (state, action) => {
        state.detailsLoading = false;
        state.groupDetails = action.payload;
      })
      .addCase(fetchGroupDetailsThunk.rejected, (state, action) => {
        state.detailsLoading = false;
        state.error = action.payload || 'Failed to load group details.';
      })
      .addCase(joinGroupThunk.pending, (state) => {
        state.joinLoading = true;
        state.error = null;
      })
      .addCase(joinGroupThunk.fulfilled, (state, action) => {
        state.joinLoading = false;
        const { groupId, membership } = action.payload;
        const candidate =
          state.availableGroups.find((group) => group._id === groupId) ||
          state.searchResults.find((group) => group._id === groupId) ||
          (state.groupDetails?._id === groupId ? state.groupDetails : undefined);

        state.availableGroups = state.availableGroups.filter((group) => group._id !== groupId);
        state.searchResults = state.searchResults.filter((group) => group._id !== groupId);

        if (candidate && !state.myGroups.some((group) => group._id === groupId)) {
          state.myGroups = [
            {
              ...candidate,
              isMember: true,
              joinedAt: membership?.joinedAt || null,
              lastReadAt: membership?.lastReadAt || null,
              unreadCount: 0,
              unreadPreview: []
            },
            ...state.myGroups
          ];
        }

        if (state.groupDetails?._id === groupId) {
          const wasMember = state.groupDetails.isMember;
          state.groupDetails.isMember = true;
          state.groupDetails.joinedAt = membership?.joinedAt || state.groupDetails.joinedAt || null;
          state.groupDetails.lastReadAt = membership?.lastReadAt || state.groupDetails.lastReadAt || null;
          if (!wasMember && typeof state.groupDetails.totalMembers === 'number') {
            state.groupDetails.totalMembers += 1;
          }
        }
      })
      .addCase(joinGroupThunk.rejected, (state, action) => {
        state.joinLoading = false;
        state.error = action.payload || 'Failed to join group.';
      })
      .addCase(fetchAvailableGroupMembersThunk.pending, (state) => {
        state.membersLoading = true;
        state.membersError = null;
      })
      .addCase(fetchAvailableGroupMembersThunk.fulfilled, (state, action) => {
        state.membersLoading = false;
        state.availableMembers = action.payload.page.items;
        state.availableMembersTotalCount = action.payload.page.totalCount;
      })
      .addCase(fetchAvailableGroupMembersThunk.rejected, (state, action) => {
        state.membersLoading = false;
        state.membersError = action.payload || 'Failed to load available group members.';
        state.error = state.membersError;
      })
      .addCase(addGroupMembersThunk.pending, (state) => {
        state.addMembersLoading = true;
        state.addMembersError = null;
        state.lastMemberAddSummary = [];
      })
      .addCase(addGroupMembersThunk.fulfilled, (state, action) => {
        state.addMembersLoading = false;
        state.lastMemberAddSummary = action.payload.results;

        const addedIds = new Set(action.payload.results.filter((result) => result.ok).map((result) => result.id));
        state.availableMembers = state.availableMembers.filter((member) => !addedIds.has(member.id));
        state.availableMembersTotalCount = Math.max(0, state.availableMembersTotalCount - action.payload.added);

        if (state.groupDetails?._id === action.payload.groupId && typeof state.groupDetails.totalMembers === 'number') {
          state.groupDetails.totalMembers += action.payload.added;
        }

        const group = state.myGroups.find((item) => item._id === action.payload.groupId);
        if (group && typeof group.totalMembers === 'number') group.totalMembers += action.payload.added;
      })
      .addCase(addGroupMembersThunk.rejected, (state, action) => {
        state.addMembersLoading = false;
        state.addMembersError = action.payload || 'Failed to add group members.';
        state.error = state.addMembersError;
      })
      .addCase(transferGroupOwnershipThunk.pending, (state) => {
        state.transferLoading = true;
        state.transferError = null;
      })
      .addCase(transferGroupOwnershipThunk.fulfilled, (state, action) => {
        state.transferLoading = false;
        const updated = action.payload;
        state.myGroups = state.myGroups.map((group) => (group._id === updated._id ? { ...group, ...updated } : group));
        state.availableGroups = state.availableGroups.map((group) =>
          group._id === updated._id ? { ...group, ...updated } : group
        );
        state.searchResults = state.searchResults.map((group) =>
          group._id === updated._id ? { ...group, ...updated } : group
        );
        if (state.groupDetails?._id === updated._id) {
          state.groupDetails = { ...state.groupDetails, ...updated };
        }
      })
      .addCase(transferGroupOwnershipThunk.rejected, (state, action) => {
        state.transferLoading = false;
        state.transferError = action.payload || 'Failed to transfer group ownership.';
        state.error = state.transferError;
      })
      .addCase(markGroupReadThunk.pending, (state) => {
        state.markReadLoading = true;
        state.markReadError = null;
      })
      .addCase(markGroupReadThunk.fulfilled, (state, action) => {
        state.markReadLoading = false;
        const { groupId, membership } = action.payload;
        const group = state.myGroups.find((item) => item._id === groupId);
        if (group) {
          group.unreadCount = 0;
          group.unreadPreview = [];
          group.lastReadAt = membership?.lastReadAt || group.lastReadAt || null;
        }
        if (state.groupDetails?._id === groupId) {
          state.groupDetails.unreadCount = 0;
          state.groupDetails.unreadPreview = [];
          state.groupDetails.lastReadAt = membership?.lastReadAt || state.groupDetails.lastReadAt || null;
        }
      })
      .addCase(markGroupReadThunk.rejected, (state, action) => {
        state.markReadLoading = false;
        state.markReadError = action.payload || 'Failed to mark the group as read.';
        state.error = state.markReadError;
      })
      .addCase(deleteGroupThunk.pending, (state) => {
        state.deleteLoading = true;
        state.error = null;
      })
      .addCase(deleteGroupThunk.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.myGroups = state.myGroups.filter((group) => group._id !== action.payload);
        state.availableGroups = state.availableGroups.filter((group) => group._id !== action.payload);
        state.searchResults = state.searchResults.filter((group) => group._id !== action.payload);
        if (state.groupDetails?._id === action.payload) {
          state.groupDetails = null;
          state.availableMembers = [];
        }
      })
      .addCase(deleteGroupThunk.rejected, (state, action) => {
        state.deleteLoading = false;
        state.error = action.payload || 'Failed to delete group.';
      })
      .addCase(leaveGroupThunk.pending, (state) => {
        state.leaveLoading = true;
        state.error = null;
      })
      .addCase(leaveGroupThunk.fulfilled, (state, action) => {
        state.leaveLoading = false;
        state.myGroups = state.myGroups.filter((group) => group._id !== action.payload);
        state.groupDetails = null;
      })
      .addCase(leaveGroupThunk.rejected, (state, action) => {
        state.leaveLoading = false;
        state.error = action.payload || 'Failed to leave group.';
      });
  }
});

export const {
  clearGroupsError,
  clearGroupDetails,
  clearGroupSearch,
  clearGroupMemberErrors,
  clearTransferOwnershipError,
  resetAvailableMembers
} = groupsSlice.actions;
export const groupsReducer = groupsSlice.reducer;
