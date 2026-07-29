import { configureStore } from '@reduxjs/toolkit';
import { authReducer } from './features/auth/auth.slice';
import { groupsReducer } from './features/groups/groups.slice';
import { messagesReducer } from './features/messages/messages.slice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    groups: groupsReducer,
    messages: messagesReducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
