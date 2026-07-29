# ChatApp Frontend

Production-oriented React, TypeScript, Redux Toolkit, Ant Design, Axios, and Socket.IO client for the NestJS ChatApp API. The application supports authentication, group discovery and membership, real-time group messaging, user discovery, and real-time one-to-one conversations.

## Current release

- Version: `0.0.1`
- Last implementation update: **2026-07-29 12:40:57 IST (UTC+05:30)**
- Frontend runtime: React 18 + Vite 5
- Backend expected at: `http://localhost:8000`

## Features

- JWT registration, login, persisted session, protected routes, and automatic logout on HTTP `401`
- Personalized, responsive workspace dashboard
- Joined-group and available-group discovery
- Group creation, group details, joining, history, and real-time messages
- Searchable user directory
- Dedicated one-to-one conversation route for every other user
- Private REST history synchronized with Socket.IO updates
- Connection status, reconnect feedback, API/socket errors, empty states, and loading states
- Duplicate-message protection when socket events are received more than once
- Responsive layouts and keyboard-accessible people cards
- Centralized API endpoints, Axios configuration, environment configuration, types, Redux state, and socket hooks

## Requirements

- Node.js 18 or newer
- npm 9 or newer
- Running ChatApp API and MongoDB
- Two registered accounts to verify one-to-one chat

## Installation and local development

```bash
npm install
npm run dev
```

Vite serves the application at `http://localhost:5173` by default.

Create a production bundle with:

```bash
npm run build
```

Preview the production bundle with:

```bash
npm run preview
```

## Environment configuration

Runtime URLs are defined in `src/environments/environment.ts`.

| Setting | Development value | Purpose |
|---|---:|---|
| `API_URL` | `http://localhost:8000/api` | Base URL for REST requests |
| `SOCKET_URL` | `http://localhost:8000` | Socket.IO server origin |

For deployment, replace these values with environment-backed Vite values such as `VITE_API_BASE_URL` and `VITE_SOCKET_URL`, or provide a build-specific environment module. The API URL must retain the `/api` prefix; the socket URL must not include that prefix.

## Backend contract

All protected REST calls send `Authorization: Bearer <accessToken>`. API responses use:

```ts
{
  code: number;
  message: string;
  data?: T;
}
```

### REST endpoints used

| Feature | Method | Endpoint |
|---|---|---|
| Register | `POST` | `/auth/register` |
| Login | `POST` | `/auth/login` |
| Current profile | `GET` | `/auth/me` |
| Discover users | `GET` | `/auth/available-users` |
| Create group | `POST` | `/groups` |
| My groups | `GET` | `/groups/my` |
| Available groups | `GET` | `/groups/available` |
| Group details | `GET` | `/groups/:groupId` |
| Join group | `POST` | `/groups/:groupId/join` |
| Group history | `GET` | `/groups/:groupId/messages` |
| Private history | `GET` | `/messages/private/:userId` |
| Private-message fallback | `POST` | `/messages/private/:userId` |

The current UI sends live private messages through Socket.IO and uses REST for durable history retrieval.

### Socket.IO contract

Socket connection:

```ts
io(SOCKET_URL, {
  path: '/socket.io',
  auth: { token: accessToken }
});
```

| Direction | Event | Payload |
|---|---|---|
| Client → server | `joinGroup` | `{ groupId }` |
| Client → server | `leaveGroup` | `{ groupId }` |
| Client → server | `sendMessage` | `{ groupId, message }` |
| Server → client | `newMessage` | `ChatMessage` |
| Client → server | `joinPrivateChat` | `{ userId }` |
| Client → server | `sendPrivateMessage` | `{ receiverId, message }` |
| Server → client | `newPrivateMessage` | `ChatMessage` |
| Server → client | `error` | `{ message }` |

Private rooms are derived server-side from the sorted pair of participant IDs. Clients never supply room names.

## Application routes

| Route | Access | Screen |
|---|---|---|
| `/login` | Public | Sign in |
| `/register` | Public | Create account |
| `/dashboard` | Private | Groups, people, direct-message entry points |
| `/groups/:groupId` | Private | Group details and joining |
| `/chat/:groupId` | Private | Group conversation |
| `/messages/:userId` | Private | One-to-one conversation |

Unknown routes render the not-found screen.

## Folder structure

```text
src/
├── @types/
│   └── index.ts
├── common/
│   └── constants.ts
├── components/
│   ├── errors/
│   ├── features/
│   │   ├── Auth/
│   │   ├── Chat/
│   │   ├── Dashboard/
│   │   ├── DirectChat/
│   │   │   ├── DirectChatScreen.tsx
│   │   │   └── directChat.css
│   │   └── Group/
│   └── layout/
├── config/
│   └── axios.config.ts
├── containers/
│   └── App/
├── environments/
│   └── environment.ts
├── redux/
│   ├── features/
│   │   ├── auth/
│   │   ├── groups/
│   │   └── messages/
│   ├── hooks.ts
│   └── store.ts
├── routes/
│   ├── PrivateRoute.tsx
│   └── index.tsx
├── shared/
│   ├── api-endpoints.ts
│   └── shared-functions.ts
├── socket/
│   ├── socket.ts
│   ├── useChatSocket.ts
│   └── usePrivateChatSocket.ts
├── styles/
│   └── index.css
└── index.tsx
```

The existing domain-based structure is preserved: UI stays under `components/features`, remote state stays in Redux feature slices, socket behavior stays in `socket`, and backend paths stay in `shared/api-endpoints.ts`.

## One-to-one chat flow

1. The dashboard requests `/auth/available-users`, excluding the signed-in user.
2. The user list can be searched by name or email.
3. Selecting a person opens `/messages/:userId`.
4. The screen requests persisted history from `/messages/private/:userId`.
5. The authenticated socket emits `joinPrivateChat`.
6. Sending emits `sendPrivateMessage` with the recipient ID and trimmed text.
7. The server persists the message and broadcasts `newPrivateMessage` to the conversation room.
8. Redux appends only messages not already identified by `_id`.
9. The view scrolls to the latest message and reflects connection loss/reconnection.

## State ownership

- `auth.slice.ts`: signed-in user, token, registration/login state, available users, and user-list loading
- `groups.slice.ts`: joined groups, discoverable groups, group details, creation, and membership state
- `messages.slice.ts`: independent group and private histories, history loading, errors, append actions, and cleanup actions
- `socket.ts`: one authenticated Socket.IO client
- Socket hooks: subscribe/unsubscribe lifecycle and typed send functions

## Production notes

- Serve the generated `dist` directory behind HTTPS.
- Configure the API and Socket.IO origins for the deployed frontend.
- Replace wildcard backend CORS with the exact production UI origin.
- Keep JWT secrets only on the server; the browser stores only the issued access token.
- Add Content Security Policy headers at the hosting layer.
- Add error monitoring and product analytics according to the deployment’s privacy policy.
- Routes are lazy loaded, and React, state, Ant Design, and transport dependencies are emitted as separate production chunks.

## Detailed change log

### 2026-07-29 12:40:57 IST (UTC+05:30)

#### One-to-one chat

- Added `AVAILABLE_USERS`, `PRIVATE_CHAT_HISTORY`, and `SEND_PRIVATE_MESSAGE` endpoint definitions.
- Added available-user loading to the auth Redux slice.
- Added private history and private-message actions to the messages Redux slice.
- Added duplicate protection for both group and private messages using message `_id`.
- Added `usePrivateChatSocket.ts` with authenticated connection, room join, event cleanup, reconnect behavior, private send, and error handling.
- Added `DirectChatScreen.tsx` with participant identity, connection status, REST history, real-time messages, empty/loading/error states, 4,000-character input limit, timestamps, auto-scroll, and responsive behavior.
- Added `/messages/:userId` as a protected route.

#### Dashboard and user experience

- Personalized the dashboard greeting with the authenticated user’s name.
- Added summary metrics for joined groups, discoverable groups, and available people.
- Added a searchable, responsive Direct Messages directory.
- Added keyboard focus styles and accessible labels for private-chat navigation.
- Preserved the existing group discovery, creation, joining, and messaging flows.
- Added route-level lazy loading, a full-page route fallback, and vendor chunk separation for production delivery.

#### Types and backend compatibility

- Expanded `ChatMessage` so group IDs are optional for private messages and added `receiverId` and `messageType`.
- Corrected the backend message schema so `groupId` is required only for `group` messages. This is necessary because private messages have `receiverId` instead of `groupId`.

#### Validation performed

- `chatApp-Ui`: `npm run build` passed with TypeScript and Vite production compilation.
- `chatApp-api`: `npm run build` passed with NestJS TypeScript compilation.
- No new frontend package was required.

## Troubleshooting

- If REST calls fail, confirm the API is running on port `8000` and the URL includes `/api`.
- If sockets do not connect, confirm `SOCKET_URL` excludes `/api`, the token is valid, and the server supports the `/socket.io` path.
- If a private conversation is empty, confirm both accounts exist and inspect the private-history request.
- If messages appear only after refresh, inspect `joinPrivateChat`, `sendPrivateMessage`, and `newPrivateMessage` in the browser’s Socket.IO traffic.
- A `401` intentionally clears the stored session and redirects to `/login`.
