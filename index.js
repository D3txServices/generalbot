require('dotenv').config();

const {
  Client,
  GatewayIntentBits,
  ActivityType,
} = require('discord.js');

const { handleMessage } = require('./handlers/autoMod');
const { postVerifyPanel, handleVerifyButton } = require('./handlers/verification');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
});

// ─────────────────────────────────────────────────────────────
// BOT READY
// ─────────────────────────────────────────────────────────────
client.once('ready', () => {
  console.log(`✅ D3TX Security Bot is online as ${client.user.tag}`);
  console.log(`📋 Monitoring channels: ${process.env.MONITORED_CHANNEL_IDS}`);
  client.user.setActivity('Watching the chat 👀', { type: ActivityType.Custom });
});

// ─────────────────────────────────────────────────────────────
// MESSAGE HANDLER — Auto Mod
// ─────────────────────────────────────────────────────────────
client.on('messageCreate', async (message) => {
  // Auto mod
  await handleMessage(message, client);

  // Admin commands
  if (message.author.bot) return;
  if (!message.member?.permissions.has('Administrator')) return;

  // Post verify panel
  if (message.content === '!setup-verify') {
    await postVerifyPanel(message.channel);
    await message.delete().catch(() => {});
    console.log(`📋 Verify panel posted in #${message.channel.name} by ${message.author.tag}`);
  }

  // Show offense count for a user (mention them)
  // Usage: !offenses @user
  if (message.content.startsWith('!offenses')) {
    const { getOffenseCount } = require('./data/moderation');
    const mentioned = message.mentions.users.first();
    if (!mentioned) {
      return message.reply('Usage: `!offenses @user`');
    }
    const count = getOffenseCount(mentioned.id);
    await message.reply(`⚠️ **${mentioned.tag}** has **${count}** offense(s) on record.`);
  }

  // Reset offense count for a user
  // Usage: !resetoffenses @user
  if (message.content.startsWith('!resetoffenses')) {
    const { offenseTracker } = require('./data/moderation');
    const mentioned = message.mentions.users.first();
    if (!mentioned) {
      return message.reply('Usage: `!resetoffenses @user`');
    }
    offenseTracker.delete(mentioned.id);
    await message.reply(`✅ Offenses for **${mentioned.tag}** have been reset.`);
  }
});

// ─────────────────────────────────────────────────────────────
// INTERACTION HANDLER — Verification button
// ─────────────────────────────────────────────────────────────
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  if (interaction.customId === 'verify_user') {
    await handleVerifyButton(interaction);
  }
});

// ─────────────────────────────────────────────────────────────
// ERROR HANDLING
// ─────────────────────────────────────────────────────────────
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
});

client.login(process.env.DISCORD_TOKEN);
