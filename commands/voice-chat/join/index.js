import { SlashCommandBuilder } from 'discord.js';
import { joinVoiceChannel } from '@discordjs/voice';

import { VoiceTranscriptor } from './utils.js';

export const data = new SlashCommandBuilder()
  .setName('join') // How the command will look
  .setDescription('Parle avec Mélanie');

export const execute = async (interaction) => {
  try {
    if (
      interaction.member == null ||
      interaction.member.voice?.channel == null
    ) {
      return interaction.reply('Je ne te vois dans aucun canal. !'); // In case the bot is not inside the channel yet
    }

    const connection = joinVoiceChannel({
      channelId: interaction.member.voice.channelId,
      guildId: interaction.guildId,
      adapterCreator: interaction.guild?.voiceAdapterCreator,
    }); // Connect to VC

    connection.receiver.speaking.on('start', (userId) => {
      const voiceTrascriptor = new VoiceTranscriptor(connection);
      voiceTrascriptor.listen(userId);
    }); // When someone talks

    interaction.reply('Je rejoins. 🦎');
  } catch (error) {
    console.log(error);
  }
};
