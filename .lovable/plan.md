
# Plan: Giveaway System Upgrades

This plan covers 6 major improvements: notifications, auto-winner, comments/reactions, share button, winner confetti animation, and redesigned cards.

---

## 1. Database Changes (Migration)

### New table: `giveaway_comments`
- `id` (uuid, PK)
- `giveaway_id` (uuid, FK to giveaways)
- `author_id` (uuid)
- `content` (text)
- `created_at` (timestamptz)

RLS: Everyone can read, authenticated users can insert (own author_id), authors/admins can delete.

### New table: `giveaway_reactions`
- `id` (uuid, PK)
- `giveaway_id` (uuid, FK to giveaways)
- `user_id` (uuid)
- `reaction_type` (text) -- e.g. 'fire', 'heart', 'thumbsup'
- `created_at` (timestamptz)
- Unique constraint on (giveaway_id, user_id, reaction_type)

RLS: Everyone can read, authenticated users can insert/delete own.

### Update `forum_notifications` table
- Add `giveaway_id` (uuid, nullable) column to support giveaway notification types (`new_giveaway`, `giveaway_winner`).

### Database trigger: `notify_new_giveaway`
- On INSERT to `giveaways` with status='active', create a notification for all users.

### Database trigger: `notify_giveaway_winner`
- On UPDATE of `giveaways` when `winner_id` changes from NULL to a value, create a notification for the winner.

### Enable realtime for `giveaway_comments`.

---

## 2. Notifications (Bell) for Giveaways

**Files:** `src/hooks/useNotifications.ts`, `src/components/NotificationBell.tsx`

- Add `giveaway_id` to the Notification interface.
- Fetch giveaway title when `giveaway_id` is present.
- Add notification content rendering for types `new_giveaway` (icon: Gift, link: /giveaways) and `giveaway_winner` (icon: Trophy, link: /giveaways).

---

## 3. Auto-pick Winner (Cron via `pg_cron`)

Set up a cron job using `pg_cron` + `pg_net` that runs every minute and calls a new edge function `auto-pick-winner`.

**New edge function:** `supabase/functions/auto-pick-winner/index.ts`
- Query giveaways where `status = 'active'` and `ends_at <= now()`.
- For each, pick a random approved entry, set `winner_id`, update status to `completed`.
- Create a support ticket for the winner (same logic as admin manual pick).
- Insert a `giveaway_winner` notification.

---

## 4. Comments and Reactions on Giveaway Cards

**File:** `src/pages/Giveaways.tsx`

- Add a collapsible comments section at the bottom of each giveaway card.
- Show reaction emoji buttons (fire, heart, thumbsup) with counts.
- Users can toggle reactions (add/remove).
- Comment input for logged-in users with real-time updates.

---

## 5. Share Button (Copy Link)

**File:** `src/pages/Giveaways.tsx`

- Add a "Share" icon button on each card.
- On click, copy the giveaway link to clipboard using `navigator.clipboard.writeText`.
- Show toast "Ссылка скопирована!".
- Link format: `{origin}/#/giveaways` (since it's a HashRouter, individual giveaway pages don't exist yet -- the link will go to the giveaways page).

---

## 6. Winner Confetti Animation

**File:** `src/pages/Giveaways.tsx`

- When a completed giveaway with a winner is displayed, show a confetti/sparkle CSS animation on the winner card.
- Use a lightweight CSS-only confetti effect (keyframe particles) around the winner announcement block -- no external library needed.
- Add confetti keyframes to tailwind config or inline styles.

---

## 7. Redesigned Cards (Much More Beautiful)

**File:** `src/pages/Giveaways.tsx`

Major visual improvements:
- **Glassmorphism effect**: Cards with `backdrop-blur`, subtle gradient borders, and glow effects on hover.
- **Animated gradient border**: Accent-colored animated border for active giveaways.
- **Progress bar**: Visual indicator of time remaining (percentage-based).
- **Better typography**: Larger title, gradient text for the prize.
- **Animated participant counter**: Pulse animation on the count.
- **Status indicators**: Animated dot (pulsing green for active).
- **Image overlay**: Better gradient overlays with blur effects.
- **Card sections**: Cleaner separation with subtle dividers.
- **Hover animations**: Smooth scale + shadow + glow transitions.
- **Winner card**: Gold gradient border, trophy animation, confetti particles.

---

## Technical Details

### Files to create:
1. `supabase/functions/auto-pick-winner/index.ts` -- edge function for auto-picking winners

### Files to modify:
1. `src/pages/Giveaways.tsx` -- complete redesign with comments, reactions, share, confetti
2. `src/hooks/useNotifications.ts` -- add giveaway_id support
3. `src/components/NotificationBell.tsx` -- render giveaway notifications
4. `src/index.css` -- add confetti/particle keyframes

### Database migration:
- Create `giveaway_comments` table with RLS
- Create `giveaway_reactions` table with RLS
- Add `giveaway_id` column to `forum_notifications`
- Create triggers for auto-notifications
- Enable realtime on `giveaway_comments`

### Cron job (via SQL insert):
- Schedule `auto-pick-winner` edge function to run every minute
