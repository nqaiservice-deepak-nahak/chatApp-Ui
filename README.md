# Real-Time Group Chat — Frontend

React + TypeScript + Vite client, using **Ant Design** for UI components and plain CSS for custom styling, with a folder structure modeled after the provided reference UI project (redux "features" slices, `containers/App`, `routes`, `socket`, `shared`, `config`, `environments`, `common`).

## Tech Stack

- React 18 + TypeScript
- Vite
- **Ant Design** (`antd` + `@ant-design/icons`) for all UI components (forms, cards, lists, layout, buttons, alerts)
- Plain CSS (`src/styles/index.css`) for layout/spacing on top of Ant Design — no Less, no CSS-in-JS
- **Redux Toolkit** (`@reduxjs/toolkit` + `react-redux`) for state, one slice per domain
- React Router
- Axios (shared instance with JWT interceptor)
- Socket.IO Client

## Installation

```bash
cp .env.example .env   # edit if your backend isn't on localhost:8000
npm install
npm run dev
```

Runs at `http://localhost:5173`.

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `VITE_API_BASE_URL` | Base URL for REST calls | `http://localhost:8000/api` |
| `VITE_SOCKET_URL` | Base URL for the Socket.IO connection | `http://localhost:8000` |

## Folder Structure

```
src/
├── index.tsx                     # entry point — Redux Provider + BrowserRouter + MyApp
├── vite-env.d.ts
├── environments/
│   └── environment.ts             # API_URL / SOCKET_URL read from import.meta.env
├── config/
│   └── axios.config.ts            # shared Axios instance — attaches JWT, handles 401
├── common/
│   └── constants.ts                # localStorage key names
├── shared/
│   ├── api-endpoints.ts            # every backend path in one place
│   └── shared-functions.ts         # get/set/clear session helpers
├── @types/
│   └── index.ts                    # User / Group / ChatMessage / AppApiResponse
├── redux/
│   ├── store.ts                     # configureStore, wires the 3 reducers together
│   ├── hooks.ts                     # typed useAppDispatch / useAppSelector
│   └── features/
│       ├── auth/auth.slice.ts        # registerThunk, loginThunk + user/token state
│       ├── groups/groups.slice.ts    # create/my/available/details/join thunks + state
│       └── messages/messages.slice.ts  # fetchChatHistoryThunk + appendMessage (for socket pushes)
├── socket/
│   ├── socket.ts                    # singleton Socket.IO client, authenticated with the JWT
│   └── useChatSocket.ts             # hook: connects, joins a group's room, exposes sendMessage()
├── routes/
│   ├── index.tsx                    # route table
│   └── PrivateRoute.tsx             # redirects to /login if there's no token
├── containers/
│   └── App/index.tsx                # root shell — Ant Design ConfigProvider + <AppRoutes />
├── components/
│   ├── layout/
│   │   └── AppHeader.tsx             # shared header (title + signed-in-as + Log Out)
│   ├── errors/
│   │   └── 404.tsx
│   └── features/
│       ├── Auth/Login.tsx, Register.tsx
│       ├── Dashboard/Dashboard.tsx    # My Chats / Available Groups / Create Group
│       ├── Group/GroupDetails.tsx
│       └── Chat/ChatScreen.tsx
└── styles/
    └── index.css                    # plain CSS, layered on top of Ant Design components
```

## How Data Flows

1. **Auth** — `Login`/`Register` dispatch `loginThunk`/`registerThunk` (in `redux/features/auth/auth.slice.ts`). On success, the JWT + user are saved to `localStorage` (via `shared/shared-functions.ts`) and mirrored into Redux state.
2. **Every REST call** goes through the shared `API` instance (`config/axios.config.ts`), which reads the token from `localStorage` and adds `Authorization: Bearer <token>` automatically — no component needs to do this itself. A `401` response clears the session and redirects to `/login`.
3. **Dashboard** dispatches `fetchMyGroupsThunk` / `fetchAvailableGroupsThunk` on mount, and `createGroupThunk` on submit.
4. **Group Details** dispatches `fetchGroupDetailsThunk`, then `joinGroupThunk` when the user clicks **Join Conversation**.
5. **Chat Screen** dispatches `fetchChatHistoryThunk` for the messages this user is allowed to see, then `useChatSocket` connects a Socket.IO client (passing the same JWT), joins the group's room, and pushes any `newMessage` event into the `messages` slice via `appendMessage`.

## Ant Design + Plain CSS

Every interactive element (forms, buttons, cards, lists, alerts, layout) is an Ant Design component — there's no hand-rolled `<input>`/`<button>` styling. `src/styles/index.css` only handles page-level layout (centering, spacing, the chat bubble look) that Ant Design doesn't provide out of the box; there's no Less and no CSS-in-JS, per your request for "normal CSS."
