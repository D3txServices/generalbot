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
// MESSAGE HANDLER
// ─────────────────────────────────────────────────────────────
client.on('messageCreate', async (message) => {
  // Auto mod
  await handleMessage(message, client);

  // Admin commands only
  if (message.author.bot) return;
  if (!message.member?.permissions.has('Administrator')) return;

  // !setup-verify — post verification panel
  if (message.content === '!setup-verify') {
    await postVerifyPanel(message.channel);
    await message.delete().catch(() => {});
    console.log(`📋 Verify panel posted in #${message.channel.name} by ${message.author.tag}`);
  }

  // !offenses @user — check offense count
  if (message.content.startsWith('!offenses')) {
    const { getOffenseCount } = require('./data/moderation');
    const mentioned = message.mentions.users.first();
    if (!mentioned) return message.reply('Usage: `!offenses @user`');
    const count = getOffenseCount(mentioned.id);
    await message.reply(`⚠️ **${mentioned.tag}** has **${count}** offense(s) on record.`);
  }

  // !resetoffenses @user — reset offense count
  if (message.content.startsWith('!resetoffenses')) {
    const { offenseTracker } = require('./data/moderation');
    const mentioned = message.mentions.users.first();
    if (!mentioned) return message.reply('Usage: `!resetoffenses @user`');
    offenseTracker.delete(mentioned.id);
    await message.reply(`✅ Offenses for **${mentioned.tag}** have been reset.`);
  }

  // !verifyall — give verified role to all members who don't have it
  if (message.content === '!verifyall') {
    const verifiedRoleId = process.env.VERIFIED_ROLE_ID;
    if (!verifiedRoleId) return message.reply('❌ VERIFIED_ROLE_ID not set in .env');

    const statusMsg = await message.reply('⏳ Fetching all members...');

    try {
      await message.guild.members.fetch();
      const unverified = message.guild.members.cache.filter(
        m => !m.user.bot && !m.roles.cache.has(verifiedRoleId)
      );

      if (unverified.size === 0) {
        return statusMsg.edit('✅ Everyone already has the verified role!');
      }

      await statusMsg.edit(`⏳ Verifying **${unverified.size}** members...`);

      let success = 0;
      let failed = 0;

      for (const [, member] of unverified) {
        try {
          await member.roles.add(verifiedRoleId);
          success++;
        } catch (e) {
          failed++;
        }
        await new Promise(r => setTimeout(r, 300));
      }

      await statusMsg.edit(`✅ Done! **${success}** members verified.${failed > 0 ? ` ❌ Failed: **${failed}**` : ''}`);
    } catch (err) {
      console.error('verifyall error:', err);
      await statusMsg.edit('❌ Something went wrong. Make sure the bot has Manage Roles permission.');
    }
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
