/**
 * Central endpoint registry, mirroring the reference project's
 * shared/api-endpoints.ts. Keeping every path in one place means a
 * backend route rename only needs to be updated here.
 */
export const API_ENDPOINTS = {
  //#region AUTH
  REGISTER: '/auth/register',
  LOGIN: '/auth/login',
  REFRESH_TOKEN: '/auth/refresh',
  PROFILE: '/auth/me',
  AVAILABLE_USERS: '/auth/available-users',
  //#endregion AUTH

  //#region GROUPS
  CREATE_GROUP: '/groups',
  MY_GROUPS: '/groups/my',
  AVAILABLE_GROUPS: '/groups/available',
  SEARCH_GROUPS: '/groups/search',
  GROUP_DETAILS: (groupId: string) => `/groups/${groupId}`,
  JOIN_GROUP: (groupId: string) => `/groups/${groupId}/join`,
  LEAVE_GROUP: (groupId: string) => `/groups/${groupId}/leave`,
  AVAILABLE_GROUP_MEMBERS: (groupId: string) => `/groups/${groupId}/available-members`,
  ADD_GROUP_MEMBERS: (groupId: string) => `/groups/${groupId}/members`,
  TRANSFER_GROUP_OWNERSHIP: (groupId: string) => `/groups/${groupId}/transfer-ownership`,
  MARK_GROUP_READ: (groupId: string) => `/groups/${groupId}/mark-as-read`,
  DELETE_GROUP: (groupId: string) => `/groups/${groupId}`,
  //#endregion GROUPS

  //#region MESSAGES
  CHATS: '/chats',
  CHAT_HISTORY: '/history',
  PRIVATE_CHAT_HISTORY: '/messages/private-history',
  SEND_PRIVATE_MESSAGE: (userId: string) => `/messages/private/${userId}`,
  DIRECT_CONVERSATIONS: '/messages/direct',
  MARK_DIRECT_READ: (otherUserId: string) => `/messages/direct/${otherUserId}/mark-as-read`
  //#endregion MESSAGES
};
