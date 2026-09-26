# لقاء · Liqa

An Arabic, RTL team meeting application built with React + Vite, Node/Express, Socket.IO, Sequelize, and MySQL. The original static animation assets remain in their existing directories; the new application lives in `frontend/` and `backend/`.

## Run locally

Requires Node.js 24+, npm, and MySQL 8+ or MariaDB 10.11+. No external API account is needed.

```sh
npm install
cp backend/.env.example backend/.env
# Configure your database connection in backend/.env.
npm run dev
```

Open http://localhost:5173. Vite proxies Socket.IO and the health endpoint to port 3001. `npm run build` produces `frontend/dist`. Each workspace also has its own package.json and dev/start or preview scripts.

The database account must be allowed to create the configured database and tables (or have a pre-created database with table creation permissions). The backend runs `CREATE DATABASE IF NOT EXISTS` and `sequelize.sync()` without destructive `force` or `alter` options. `backend/schema.sql` is the equivalent SQL schema. Schema updates in an established production database should use reviewed migrations.

### Administrator

The requested initial administrator is provisioned on first startup:

- Login: `user01@00`
- Password: `user01@00`
- Role: `200` (members have role `100`)

Set `ADMIN_LOGIN` and `ADMIN_PASSWORD` before the first public deployment. Existing passwords are never overwritten by startup. Sign out of the preview member account to use the administrator login. New members receive the credentials created by the administrator; the application does not send invitation emails.

### Local preview

`DEMO_MODE=true` explicitly enables an automatically authenticated **member** account and six synthetic profiles with three project rooms. It is disabled by default in `.env.example`; never enable it for a public deployment. The supplied sandbox is configured for this mode so the workspace can be explored immediately. Every shown online count and live-room state comes from actual connected sessions. People pictured in the hero are decorative examples, not live video feeds.

## Features and pages

- `/`: dashboard, project rooms, team presence, next scheduled meeting.
- `/login`: member and administrator login.
- `/meetings`: room search, live filter, immediate and scheduled room creation.
- `/room/:id`: group video rooms (up to eight peers), microphone/camera controls, screen sharing, persisted room messages, invitation links.
- `/private`: one-to-one invitations, online-member filter, private calls. Offline members can join using the private room link after signing in; in-app invitations are delivered to connected recipients.
- `/team`: searchable member directory.
- `/admin`: server-enforced role 200 access, animated three-step member form, current online members, and participants in active private calls. Admins do not automatically have access to private rooms or their messages.
- `/unauthorized`: member access to administration is redirected here.

The header is 100px and footer 75px. CSS Modules use camelCase class names, with shared form/button primitives in `styles.css`. The context owns Socket.IO state, session, presence, invitations, and global actions; utility and hook files keep transport and WebRTC logic separate from page rendering.

## Communication and security

All application reads/writes, authentication, chat, invitations, presence, and WebRTC signaling use Socket.IO acknowledgements. HTTP is used only for assets, the initial Socket.IO transport when needed, and `/api/health`. Media itself uses peer-to-peer WebRTC, since Socket.IO is the signaling layer and not a media transport.

Passwords use salted scrypt. Random, 24-hour session tokens are hashed in MySQL and stored per browser tab in sessionStorage. The backend checks authorization and private membership, validates inputs, limits login attempts and event throughput, and serializes public member fields without password hashes. A single Socket.IO server process tracks live presence; multi-process production deployment needs shared presence storage and a Socket.IO adapter.

For camera/microphone access, use HTTPS (localhost is allowed during development). Some networks require a TURN relay: configure `TURN_URL`, `TURN_USERNAME`, and `TURN_CREDENTIAL`. No TURN service is bundled. For an internet deployment, use short-lived TURN credentials, a reverse proxy serving the SPA and Socket.IO on the same HTTPS origin, and set `CLIENT_ORIGIN` accordingly. The default backend bind address is loopback; set `HOST` when using a container network. There is no recording feature.

## Database layout

- `team_members`: identities, password hashes, team, title, role.
- `conversations`: group/private rooms, creator, project, scheduled time.
- `conversation_members`: many-to-many member/room relation, enforced for private access.
- `messages`: room/member foreign keys and text, timestamp.
- `sessions`: token hashes, expiry, member foreign key.

## Verification

```sh
npm run build
npm test
npm audit
```

Tests load the local `backend/.env`, launch an isolated backend, and use a temporary `liqa_test_<pid>` database. Grant the test account creation and deletion rights for that prefix in a disposable environment. They cover password handling, validation, authentication, role checks, invitations, room membership, signaling isolation, message persistence, session revocation, and multi-tab presence. They drop only their temporary test database.

## Assets

Noto Sans Arabic is bundled locally (SIL Open Font License); its license is in `frontend/public/fonts/OFL.txt`. Local portrait assets come from Unsplash; see `frontend/public/avatars/credits.md`. The meeting illustration and project shapes use CSS and existing icon primitives.
