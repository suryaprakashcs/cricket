# 👑 ROYAL KINGS — Cricket Team Management

React + Redux Toolkit + Tailwind (royal-blue `#002BD0` ref + crown-yellow `#F9E04A` ref), wired to `../backend`.
No more WhatsApp chasing: **Create Match → Notify → Availability → Remind → Playing XI → Announce → Result.**

## Roles

`player | captain | admin` — enforced backend + route guards.

| Capability | admin | captain | player |
|---|---|---|---|
| Manage team / roles / deactivate | ✅ | — | — |
| Create / edit / cancel matches | ✅ | ✅ | — |
| View availability dashboard | ✅ | ✅ | counts only via match page |
| Remind pending players | ✅ | ✅ | — |
| Select XI + reserves, announce | ✅ | ✅ | — |
| Record result | ✅ | ✅ | — |
| Respond Available/Maybe/No | ✅ | ✅ | ✅ (self only) |
| Inbox, stats, history | ✅ | ✅ | ✅ |

## Flows

- **Match creation** (`/matches/new` → `POST /api/matches`): saves match, creates `pending` availability for every active player, sends each a `match_created` notification with a tap-to-respond link.
- **Availability** (`PUT /api/matches/:id/availability`): strict enum `available | maybe | not_available` — no free text. Players self-only; leaders may mark on behalf; players blocked after deadline.
- **Reminders** (`POST /api/matches/:id/remind`, auto-hourly within 24h of deadline): pending players ONLY. Returns `wa.me` deep links for manual WhatsApp forwarding.
- **Squad** (`PUT /api/matches/:id/squad`): max 11 XI, max 5 reserves, no duplicates, C/VC/WK must be in XI, only Available/Maybe selectable (admin `force:true` override). Announce (`POST …/announce`) needs exactly 11 + C + WK and notifies XI + reserves with different messages.
- **Result** (`PATCH /api/matches/:id/result`): after announcement; notifies whole team; feeds stats + history.
- **Notifications** (`/api/notifications` inbox): DB is the source of truth. Outbound channel is pluggable via `services/notificationService.js` (`NOTIFY_PROVIDER`, default `console`) — plug WhatsApp Cloud API in later without touching anything else.

## Run

```bash
cp .env.example .env   # VITE_API_URL=http://localhost:5000/api
npm install
npm run dev            # http://localhost:5173
```

Backend (`../backend`): `npm run dev` — needs `MONGOOSE_URI` + `JWT_SECRET`. `FRONTEND_URL` controls respond-links in messages.
