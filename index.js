import { Client, GatewayIntentBits, Events } from 'discord.js';
import { registerCommands, loadCommands } from './commands.js';
import dotenv from 'dotenv';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

registerCommands();

client.on(Events.InteractionCreate, async (interaction) => {
  loadCommands(interaction);
});

dotenv.config();
client.login(process.env.DISCORD_TOKEN);