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
    .setTitle('🎮 Welcome to D3TX Services!')
    .setColor(0xf5a623)
    .setDescription(
      [
        '> The **#1 destination** for premium Cronus Zen anti-recoil scripts and configs.',
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        '**To gain full access to the server, click the button below.**',
        '',
        'By verifying you confirm that you agree to our:',
        '🌐 **Terms of Service** → [d3tx.services/terms](https://d3tx.services)',
        '📋 **Patreon Rules** → [patreon.com/d3tx](https://patreon.com/d3tx)',
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        '📦 **What we offer:**',
        '→ Anti-recoil scripts for Warzone, Apex, Fortnite, R6, BF6 & PUBG',
        '→ Regular updates and new weapon support',
        '→ Dedicated support via tickets',
        '',
        '> 💬 Need help? Open a ticket and our team will assist you.',
      ].join('\n')
    )
    .setFooter({ text: 'D3TX Services • d3tx.services' })
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
