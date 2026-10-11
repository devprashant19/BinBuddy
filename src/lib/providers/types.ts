import { Classification } from '../schemas/classification';

export interface ClassifierInput {
  bytes: Buffer;
  mime: string;
}

export interface ClassifierProvider {
  name: string;
  classifierVersion: string;
  classify(input: ClassifierInput): Promise<Classification>;
}
