const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');

// ─────────────────────────────────────────────────────────────
// POST VERIFICATION PANEL
// Called by !setup-verify command
// ─────────────────────────────────────────────────────────────
async function postVerifyPanel(channel) {
  const embed = new EmbedBuilder()
    .setTitle('🔐 D3TX Services — Verification & Terms of Service')
    .setColor(0xf5a623)
    .setDescription(
      [
        '> **Welcome to D3TX Services!** Before gaining access to the server, you must read and agree to our full Terms of Service below.',
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '⛔ **NO REFUND POLICY — All Sales Are Final**',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        'Once a purchase is made, the script is delivered digitally. **No refunds — no matter the reason.**',
        '→ Deleting the script does **not** qualify for a refund',
        '→ Resetting your PC does **not** qualify for a refund',
        '→ No longer wanting the script does **not** qualify',
        '→ Script files are always re-downloadable from your Patreon account',
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '🚫 **ZERO TOLERANCE — No Chargebacks or Disputes**',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        'Attempting a chargeback results in **permanent ban** from all D3TX platforms.',
        '→ Always contact support first via Discord or **support@d3tx.services**',
        '→ Chargebacks = immediate permanent blacklist — no exceptions',
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '🔒 **PERSONAL USE ONLY — No Sharing or Reselling**',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        'All scripts and memberships are strictly for the **buyer only.**',
        '→ Sharing with anyone — friends, family, online — is **prohibited**',
        '→ Leaking or posting scripts publicly = **permanent ban**',
        '→ Reselling D3TX scripts under any name **will be pursued legally**',
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '📋 **SCOPE — Applies to All Platforms**',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        'These terms apply to: **Patreon, Discord, d3tx.services** and all affiliated platforms.',
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '⚠️ **YOUR RESPONSIBILITY**',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '"I didn\'t read the rules" is **not accepted.** Rules are pinned in Discord and available at **d3tx.services** at all times.',
        '',
        '🔄 D3TX Services reserves the right to update these terms at any time. Continued use = acceptance.',
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '*By clicking **Verify** below, you confirm you have fully read, understood, and agree to all D3TX Terms of Service above.*',
      ].join('\n')
    )
    .setFooter({ text: 'D3TX Services • d3tx.services • Powered by D3TX Security' })
    .setTimestamp();

  const button = new ButtonBuilder()
    .setCustomId('verify_user')
    .setLabel('✅ I Agree — Verify Me')
    .setStyle(ButtonStyle.Success);

  const row = new ActionRowBuilder().addComponents(button);

  await channel.send({ embeds: [embed], components: [row] });
}

// ─────────────────────────────────────────────────────────────
// HANDLE VERIFY BUTTON CLICK
// ─────────────────────────────────────────────────────────────
async function handleVerifyButton(interaction) {
  const verifiedRoleId = process.env.VERIFIED_ROLE_ID;

  if (!verifiedRoleId) {
    return interaction.reply({
      content: '❌ Verification role not configured. Please contact an admin.',
      ephemeral: true,
    });
  }

  // Check if already verified
  if (interaction.member.roles.cache.has(verifiedRoleId)) {
    return interaction.reply({
      content: '✅ You\'re already verified!',
      ephemeral: true,
    });
  }

  // Give verified role
  try {
    await interaction.member.roles.add(verifiedRoleId);

    const successEmbed = new EmbedBuilder()
      .setTitle('✅ Verified!')
      .setColor(0x57f287)
      .setDescription(
        [
          `Welcome to **D3TX**, ${interaction.user.username}! 🎉`,
          '',
          'You now have access to the server.',
          'Feel free to explore the channels and ask if you need any help!',
        ].join('\n')
      )
      .setFooter({ text: 'D3TX • Enjoy your stay' })
      .setTimestamp();

    await interaction.reply({ embeds: [successEmbed], ephemeral: true });

    console.log(`✅ ${interaction.user.tag} verified successfully`);
  } catch (err) {
    console.error('Could not assign verified role:', err.message);
    await interaction.reply({
      content: '❌ Could not verify you. Please contact an admin.',
      ephemeral: true,
    });
  }
}

module.exports = { postVerifyPanel, handleVerifyButton };
