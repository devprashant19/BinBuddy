import { ElevenLabsClient } from 'elevenlabs';
import { getEnv } from '../config/env';

export interface GenerateSpeechOptions {
  text: string;
  voiceId?: string;
  modelId?: string;
}

export class ElevenLabsService {
  private readonly client: ElevenLabsClient;
  private readonly defaultVoiceId: string;
  private readonly defaultModelId: string;

  constructor(apiKey?: string, voiceId?: string, modelId?: string) {
    const env = getEnv();
    const key = apiKey || env.ELEVENLABS_API_KEY;
    if (!key) {
      throw new Error('ELEVENLABS_API_KEY must be configured.');
    }

    this.client = new ElevenLabsClient({ apiKey: key });
    this.defaultVoiceId = voiceId || env.ELEVENLABS_VOICE_ID;
    this.defaultModelId = modelId || env.ELEVENLABS_MODEL_ID;
  }

  public async generateSpeech(options: GenerateSpeechOptions): Promise<Buffer> {
    const env = getEnv();

    if (env.FORCE_FAILURE === 'elevenlabs' || env.FORCE_FAILURE === 'both') {
      throw new Error('VOICE_UNAVAILABLE: Injected simulated ElevenLabs failure.');
    }

    const voiceId = options.voiceId || this.defaultVoiceId;
    const modelId = options.modelId || this.defaultModelId;

    try {
      const callPromise = this.client.textToSpeech.convert(voiceId, {
        text: options.text,
        model_id: modelId,
        output_format: 'mp3_44100_128',
      });

      // 10 second timeout
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('TIMEOUT: ElevenLabs TTS call exceeded 10 seconds')),
          10000
        )
      );

      const responseStream = await Promise.race([callPromise, timeoutPromise]);
      return await this.streamToBuffer(responseStream);
    } catch (err: any) {
      const msg = err.message || '';
      throw new Error(`VOICE_UNAVAILABLE: ElevenLabs service failed: ${msg}`);
    }
  }

  private async streamToBuffer(stream: any): Promise<Buffer> {
    if (Buffer.isBuffer(stream)) {
      return stream;
    }

    // Handle ReadableStream or AsyncIterable
    const chunks: Buffer[] = [];
    if (Symbol.asyncIterator in Object(stream)) {
      for await (const chunk of stream) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      return Buffer.concat(chunks);
    }

    if (typeof stream.on === 'function') {
      return new Promise<Buffer>((resolve, reject) => {
        stream.on('data', (chunk: any) =>
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
        );
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', (err: any) => reject(err));
      });
    }

    throw new Error('Unsupported stream format received from ElevenLabs.');
  }
}
