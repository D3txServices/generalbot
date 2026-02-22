# D3TX Security Bot
Verification system + Auto-Mod in one bot.

---

## Setup

### 1. Install & configure
```bash
npm install
cp .env.example .env
```

Fill in your `.env`:
```
DISCORD_TOKEN=your_bot_token
CLIENT_ID=your_client_id
VERIFY_CHANNEL_ID=channel_where_verify_panel_goes
VERIFIED_ROLE_ID=role_id_to_give_verified_users
MOD_LOG_CHANNEL_ID=private_staff_log_channel_id
MONITORED_CHANNEL_IDS=general_channel_id,support_channel_id
```

### 2. How to get IDs
- Enable Developer Mode in Discord (Settings → Advanced → Developer Mode)
- Right click any channel → **Copy Channel ID**
- Right click any role → **Copy Role ID**

### 3. Bot permissions needed
In Discord Developer Portal → Bot → give these permissions:
- Manage Roles
- Moderate Members (for timeouts)
- Kick Members
- Read Messages
- Send Messages
- Manage Messages (to delete bad messages)
- Read Message History
- Send Messages in Threads

### 4. Start the bot
```bash
npm start
```

---

## Admin Commands

| Command | Description |
|---------|-------------|
| `!setup-verify` | Posts the verification panel in the current channel |
| `!offenses @user` | Check how many offenses a user has |
| `!resetoffenses @user` | Reset a user's offense count |

---

## How Verification Works
1. Admin types `!setup-verify` in the verify channel
2. Bot posts the rules embed with a green **Verify** button
3. User clicks the button → instantly gets the Verified role
4. Response is ephemeral (only they can see it)

---

## How Auto-Mod Works
1. Bot watches every message in your configured channels
2. If a bad word or phrase is detected:
   - Message is deleted instantly
   - User is timed out based on their offense count
   - User receives a DM explaining why
   - Staff log channel gets a full report
3. Admins and Moderators are exempt from auto-mod

### Timeout Scale
| Offense | Duration |
|---------|----------|
| 1st | 10 minutes |
| 2nd | 1 hour |
| 3rd | 24 hours |
| 4th+ | 24 hours |

---

## Adding/Removing Bad Words
Open `data/moderation.js` and edit the `BAD_WORDS` or `BAD_PHRASES` arrays. No other files need changing.
