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
  //#endregion GROUPS

  //#region MESSAGES
  CHAT_HISTORY: (groupId: string) => `/groups/${groupId}/messages`,
  PRIVATE_CHAT_HISTORY: (userId: string) => `/messages/private/${userId}`,
  SEND_PRIVATE_MESSAGE: (userId: string) => `/messages/private/${userId}`
  //#endregion MESSAGES
};
