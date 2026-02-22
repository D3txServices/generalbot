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
    .setTitle('✅ D3TX Verification')
    .setColor(0x57f287)
    .setDescription(
      [
        '**Welcome to D3TX!** 👋',
        '',
        'Before you can access the server, please read and agree to our rules:',
        '',
        '**📜 Server Rules:**',
        '**1.** Be respectful to all members and staff',
        '**2.** No spamming, flooding or excessive caps',
        '**3.** No hate speech, slurs or abusive language',
        '**4.** No false claims, spreading misinformation or calling out staff',
        '**5.** No advertising or self-promotion without permission',
        '**6.** No sharing of personal information',
        '**7.** Keep conversations in the correct channels',
        '**8.** Follow Discord\'s Terms of Service at all times',
        '',
        'By clicking **Verify** below, you confirm that you have read and agree to all of the above rules.',
        '',
        '> 🔒 Violations may result in timeouts or removal from the server.',
      ].join('\n')
    )
    .setFooter({ text: 'D3TX • Click verify to gain access' });

  const button = new ButtonBuilder()
    .setCustomId('verify_user')
    .setLabel('✅ I agree — Verify Me')
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
