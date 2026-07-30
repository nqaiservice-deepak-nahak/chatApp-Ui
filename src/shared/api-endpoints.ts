/**
 * Central endpoint registry, mirroring the reference project's
 * shared/api-endpoints.ts. Keeping every path in one place means a
 * backend route rename only needs to be updated here.
 */
export const API_ENDPOINTS = {
  //#region AUTH
  REGISTER: '/auth/register',
  LOGIN: '/auth/login',
  PROFILE: '/auth/me',
  AVAILABLE_USERS: '/auth/available-users',
  //#endregion AUTH

  //#region GROUPS
  CREATE_GROUP: '/groups',
  MY_GROUPS: '/groups/my',
  AVAILABLE_GROUPS: '/groups/available',
  GROUP_DETAILS: (groupId: string) => `/groups/${groupId}`,
  JOIN_GROUP: (groupId: string) => `/groups/${groupId}/join`,
  DELETE_GROUP: (groupId: string) => `/groups/${groupId}`,
  //#endregion GROUPS

  //#region MESSAGES
  CHAT_HISTORY: '/history',
  PRIVATE_CHAT_HISTORY: '/messages/private-history',
  SEND_PRIVATE_MESSAGE: (userId: string) => `/messages/private/${userId}`
  //#endregion MESSAGES
};
