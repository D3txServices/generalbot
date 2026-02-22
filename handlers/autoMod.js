const { EmbedBuilder } = require('discord.js');
const {
  incrementOffense,
  getTimeoutDuration,
  getTimeoutLabel,
} = require('../data/moderation');

// ─────────────────────────────────────────────────────────────
// AI MODERATION — OpenAI GPT-4o mini
// ─────────────────────────────────────────────────────────────
async function checkWithAI(content) {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 60,
        temperature: 0,
        messages: [
          {
            role: 'system',
            content: `You are a Discord chat moderator for D3TX, a Cronus Zen gaming product server.

Your job is to detect if a message violates any of these rules:
1. Profanity or abusive language (swearing, slurs, insults)
2. Calling D3TX a scam, fake, fraud, or accusing staff of lying/cheating
3. Harassing or disrespecting other members or staff
4. Threatening language
5. Spam or excessive caps
6. ANY mention of refund, money back, chargeback, dispute, PayPal dispute, getting money back, want my money, return my money, give me my money

Respond ONLY in this exact JSON format, nothing else:
{"violation": true, "reason": "short reason here", "silent": false}
or
{"violation": false, "reason": "", "silent": false}

IMPORTANT refund examples — ALL of these must be caught and marked silent:
- "I want a refund"
- "give me my money back"
- "I'm opening a dispute"
- "I'll do a chargeback"
- "can I get refunded"
- "refund me"
- "return my payment"
- "I want my money back"
- "going to dispute this"
- "filing a PayPal claim"
Any message asking for money back in any form = violation with silent: true.

For all refund/chargeback/dispute violations set "silent": true.
For all other violations set "silent": false.

Be smart about context. "I got scammed by someone else" is NOT a violation. "D3TX scammed me" IS a violation.
Creative bypasses like sc@m, sh1t, f*ck should still be caught.
Short messages like "lol" or "thanks" are never violations.`,
          },
          {
            role: 'user',
            content: `Message to check: "${content}"`,
          },
        ],
      }),
    });

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content?.trim();

    if (!text) return { violation: false, reason: '', silent: false };

    const parsed = JSON.parse(text);
    return parsed;
  } catch (err) {
    console.error('OpenAI moderation error:', err.message);
    return { violation: false, reason: '', silent: false };
  }
}

// ─────────────────────────────────────────────────────────────
// HANDLE INCOMING MESSAGE
// ─────────────────────────────────────────────────────────────
async function handleMessage(message, client) {
  if (message.author.bot) return;
  if (!message.guild) return;

  const monitoredChannels = process.env.MONITORED_CHANNEL_IDS
    ? process.env.MONITORED_CHANNEL_IDS.split(',').map(id => id.trim())
    : [];

  if (!monitoredChannels.includes(message.channel.id)) return;
  if (message.content.trim().length < 3) return;

  if (message.member?.permissions.has('Administrator')) return;
  if (message.member?.permissions.has('ModerateMembers')) return;

  // Check with AI
  const { violation, reason, silent } = await checkWithAI(message.content);
  if (!violation) return;

  // Delete the message
  try {
    await message.delete();
  } catch (err) {
    console.error('Could not delete message:', err.message);
  }

  // Track offense and get timeout duration
  const offenseCount = incrementOffense(message.author.id);
  const timeoutDuration = getTimeoutDuration(offenseCount);
  const timeoutLabel = getTimeoutLabel(offenseCount);

  // Apply timeout
  try {
    await message.member.timeout(timeoutDuration, `AI Auto-mod: ${reason}`);
  } catch (err) {
    console.error('Could not timeout member:', err.message);
  }

  // DM the user — skip if silent (refund requests)
  if (!silent) {
    try {
      const dmEmbed = new EmbedBuilder()
        .setTitle('⚠️ You\'ve been timed out in D3TX')
        .setColor(0xff4444)
        .setDescription(
          [
            `Your message in **D3TX** was removed and you have been timed out for **${timeoutLabel}**.`,
            '',
            '**Reason:**',
            `\`${reason}\``,
            '',
            '**Your offense history:**',
            `This is your **offense #${offenseCount}**.`,
            '',
            '**Timeout scale:**',
            '1st offense → 10 minutes',
            '2nd offense → 30 minutes',
            '3rd+ offense → 4 hours',
            '',
            'Please keep the chat respectful and follow the server rules.',
            'If you believe this was a mistake, please contact staff.',
          ].join('\n')
        )
        .setFooter({ text: 'D3TX AI Security System' })
        .setTimestamp();

      await message.author.send({ embeds: [dmEmbed] });
    } catch (err) {
      console.log(`Could not DM ${message.author.tag} — DMs may be closed`);
    }
  }

  // Log to staff channel
  const logChannelId = process.env.MOD_LOG_CHANNEL_ID;
  if (!logChannelId) return;

  try {
    const logChannel = await client.channels.fetch(logChannelId);
    if (!logChannel) return;

    const logEmbed = new EmbedBuilder()
      .setTitle(silent ? '🔇 Silent Auto-Mod Action' : '🤖 AI Auto-Mod Action')
      .setColor(silent ? 0x9b59b6 : 0xff9900)
      .addFields(
        { name: '👤 User', value: `${message.author.tag} (<@${message.author.id}>)`, inline: true },
        { name: '📍 Channel', value: `<#${message.channel.id}>`, inline: true },
        { name: '⏱️ Timeout', value: timeoutLabel, inline: true },
        { name: '🚨 Offense #', value: `${offenseCount}`, inline: true },
        { name: '🔕 Silent', value: silent ? 'Yes — no DM sent' : 'No — DM sent', inline: true },
        { name: '🤖 AI Reason', value: `\`${reason}\``, inline: false },
        { name: '💬 Message Content', value: `\`\`\`${message.content.slice(0, 500)}\`\`\``, inline: false },
      )
      .setThumbnail(message.author.displayAvatarURL())
      .setFooter({ text: `User ID: ${message.author.id} • Powered by GPT-4o mini` })
      .setTimestamp();

    await logChannel.send({ embeds: [logEmbed] });
  } catch (err) {
    console.error('Could not send to log channel:', err.message);
  }
}

module.exports = { handleMessage };

// ─────────────────────────────────────────────────────────────
// AI MODERATION — OpenAI GPT-4o mini
// ─────────────────────────────────────────────────────────────
async function checkWithAI(content) {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 60,
        temperature: 0,
        messages: [
          {
            role: 'system',
            content: `You are a Discord chat moderator for D3TX, a Cronus Zen gaming product server.

Your job is to detect if a message violates any of these rules:
1. Profanity or abusive language (swearing, slurs, insults)
2. Calling D3TX a scam, fake, fraud, or accusing staff of lying/cheating
3. Harassing or disrespecting other members or staff
4. Threatening language
5. Spam or excessive caps

Respond ONLY in this exact JSON format, nothing else:
{"violation": true, "reason": "short reason here"}
or
{"violation": false, "reason": ""}

Be smart about context. "I got scammed by someone else" is NOT a violation. "D3TX scammed me" IS a violation.
Creative bypasses like sc@m, sh1t, f*ck should still be caught.
Short messages like "lol" or "thanks" are never violations.`,
          },
          {
            role: 'user',
            content: `Message to check: "${content}"`,
          },
        ],
      }),
    });

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content?.trim();

    if (!text) return { violation: false, reason: '' };

    const parsed = JSON.parse(text);
    return parsed;
  } catch (err) {
    console.error('OpenAI moderation error:', err.message);
    // If AI fails, don't punish — fail safe
    return { violation: false, reason: '' };
  }
}

// ─────────────────────────────────────────────────────────────
// HANDLE INCOMING MESSAGE
// ─────────────────────────────────────────────────────────────
async function handleMessage(message, client) {
  // Ignore bots and DMs
  if (message.author.bot) return;
  if (!message.guild) return;

  // Only monitor configured channels
  const monitoredChannels = process.env.MONITORED_CHANNEL_IDS
    ? process.env.MONITORED_CHANNEL_IDS.split(',').map(id => id.trim())
    : [];

  if (!monitoredChannels.includes(message.channel.id)) return;

  // Ignore very short messages (not worth checking, saves API costs)
  if (message.content.trim().length < 3) return;

  // Ignore admins and moderators
  if (message.member?.permissions.has('Administrator')) return;
  if (message.member?.permissions.has('ModerateMembers')) return;

  // Check with AI
  const { violation, reason } = await checkWithAI(message.content);
  if (!violation) return;

  // Delete the message
  try {
    await message.delete();
  } catch (err) {
    console.error('Could not delete message:', err.message);
  }

  // Track offense and get timeout duration
  const offenseCount = incrementOffense(message.author.id);
  const timeoutDuration = getTimeoutDuration(offenseCount);
  const timeoutLabel = getTimeoutLabel(offenseCount);

  // Apply timeout
  try {
    await message.member.timeout(timeoutDuration, `AI Auto-mod: ${reason}`);
  } catch (err) {
    console.error('Could not timeout member:', err.message);
  }

  // DM the user
  try {
    const dmEmbed = new EmbedBuilder()
      .setTitle('⚠️ You\'ve been timed out in D3TX')
      .setColor(0xff4444)
      .setDescription(
        [
          `Your message in **D3TX** was removed and you have been timed out for **${timeoutLabel}**.`,
          '',
          '**Reason:**',
          `\`${reason}\``,
          '',
          '**Your offense history:**',
          `This is your **offense #${offenseCount}**.`,
          '',
          '**Timeout scale:**',
          '1st offense → 10 minutes',
          '2nd offense → 30 minutes',
          '3rd+ offense → 4 hours',
          '',
          'Please keep the chat respectful and follow the server rules.',
          'If you believe this was a mistake, please contact staff.',
        ].join('\n')
      )
      .setFooter({ text: 'D3TX AI Security System' })
      .setTimestamp();

    await message.author.send({ embeds: [dmEmbed] });
  } catch (err) {
    console.log(`Could not DM ${message.author.tag} — DMs may be closed`);
  }

  // Log to staff channel
  const logChannelId = process.env.MOD_LOG_CHANNEL_ID;
  if (!logChannelId) return;

  try {
    const logChannel = await client.channels.fetch(logChannelId);
    if (!logChannel) return;

    const logEmbed = new EmbedBuilder()
      .setTitle('🤖 AI Auto-Mod Action')
      .setColor(0xff9900)
      .addFields(
        { name: '👤 User', value: `${message.author.tag} (<@${message.author.id}>)`, inline: true },
        { name: '📍 Channel', value: `<#${message.channel.id}>`, inline: true },
        { name: '⏱️ Timeout', value: timeoutLabel, inline: true },
        { name: '🚨 Offense #', value: `${offenseCount}`, inline: true },
        { name: '🤖 AI Reason', value: `\`${reason}\``, inline: false },
        { name: '💬 Message Content', value: `\`\`\`${message.content.slice(0, 500)}\`\`\``, inline: false },
      )
      .setThumbnail(message.author.displayAvatarURL())
      .setFooter({ text: `User ID: ${message.author.id} • Powered by GPT-4o mini` })
      .setTimestamp();

    await logChannel.send({ embeds: [logEmbed] });
  } catch (err) {
    console.error('Could not send to log channel:', err.message);
  }
}

module.exports = { handleMessage };
