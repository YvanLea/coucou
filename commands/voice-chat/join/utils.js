import pkg from '@discordjs/opus';
const { OpusEncoder } = pkg;

import {
  AudioPlayerStatus,
  EndBehaviorType,
  createAudioResource,
  createAudioPlayer,
} from '@discordjs/voice';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { SpeechClient } from '@google-cloud/speech';
import fs from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import { talkToAI } from './talkToAI.js'

const REQUEST_CONFIG = {
  encoding: "LINEAR16",
  sampleRateHertz: 48000,
  languageCode: "fr-FR", // Change to the language you want
  audioChannelCount: 2,
};


export class VoiceTranscriptor {
  connection;
  receiver;
  speechClient = new SpeechClient();

  message;
  commandsChannel;

  time;
  messageId;
  constructor(connection) {
    this.connection = connection;
    this.receiver = this.connection.receiver;
  }

  async listen(userId) {
    try {
      console.log(`Listening to ${userId} 🦎`);
      this.dataSubscriptions(userId);
    } catch (error) {
      console.log(error);
    }
  }

  dataSubscriptions(userId) {
    let subscription = this.receiver.subscribe(userId, {
      end: {
        behavior: EndBehaviorType.AfterSilence,
        duration: 100,
      },
    });

    const buffers = [];
    const encoder = new OpusEncoder(48000, 2);
    let keywordDetected = false; // Ajout pour détecter le mot clé

    subscription.on('data', (chunk) => {
      if (!keywordDetected) {
        buffers.push(encoder.decode(chunk));
      }
    });

    subscription.once('end', async () => {
      if (buffers.length < 1) {
        return console.log('Audio trop court');
      }
      this.time = performance.now();

      // Enregistrement du buffer pour la transcription
      const outputPath = this.getOutputPath(buffers);
      const transcription = await this.getTranscription(outputPath);

      // Vérification de la présence du mot clé "Mélanie"
      if (transcription.startsWith("mélanie ")) {
        keywordDetected = true;
        console.log(`Mot clé détecté : ${transcription}`);
        const command = transcription.slice("mélanie ".length); // Enlever "Mélanie" du début
        if (command.length > 0) {
          return this.AISpeech(command); // Continuer si une commande suivait le mot clé
        }
      } else {
        console.log(`Mot clé "Mélanie" non détecté. Transcription: ${transcription}`);
      }
    });
  }

  async getTranscription(tempFileName) {
    try {
      const bytes = fs.readFileSync(tempFileName).toString('base64');
      const request = {
        audio: {
          content: bytes,
        },
        config: REQUEST_CONFIG,
      };

      const [response] = await this.speechClient.recognize(request);
      if (response && response.results) {
        const transcription = response.results
          .map((result) => {
            if (result.alternatives) return result.alternatives[0].transcript;
            else {
              console.log(result);
              throw Error('No alternatives');
            }
          })
          .join('\n');

        return transcription.toLowerCase();
      } else {
        console.log(response);
        throw Error('No response or response results');
      }
    } catch (error) {
      console.log(error);
    }
  }

  async AISpeech(transcription) {
    try {
      // Call ChatGPT API
      const text = await talkToAI(transcription);
      const textToSpeech = new TextToSpeechClient();
      const request = {
        input: { text },
        voice: {
          languageCode: 'fr-FR', // Change it to the language you want
          ssmlGender: 'FEMALE', // Gender
        },
        audioConfig: { audioEncoding: 'MP3' },
      };

      const [response] = await textToSpeech.synthesizeSpeech(request);

      fs.writeFileSync('./assets/output.mp3', response.audioContent, 'binary');

      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);

      const resource = createAudioResource(
        join(__dirname, '../../../assets/output.mp3')
      );

      const player = createAudioPlayer();

      this.playerSubcription(player);

      const delay = performance.now() - (this.time || 0);
      const delaySeconds = delay / 1000;
      const delayRounded = delaySeconds.toFixed(2);
      console.log(`This took ${delayRounded}s 👺⌚`)

      // Start speaking
      this.connection.subscribe(player);
      player.play(resource);
    } catch (err) {
      console.log(err);
    }
  }

  playerSubcription(player) {
    player.on('error', (error) => {
      console.log('Error:', error.message);
      this.connection.destroy();
    });

    player.on(AudioPlayerStatus.Idle, () => {
      player.removeAllListeners();
    });
  }

  getOutputPath(buffers) {
    const concatenatedBuffer = Buffer.concat(buffers);
    const outputPath = './assets/input.pcm';
    fs.writeFileSync(outputPath, concatenatedBuffer);
    return outputPath;
  }
}
