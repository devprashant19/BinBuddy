import crypto from 'crypto';
import { ClassifierProvider, ClassifierInput } from './types';
import { Classification } from '../schemas/classification';
import fixturesData from '../../../data/fixtures/classification-fixtures.json';

export class MockClassifierProvider implements ClassifierProvider {
  public readonly name = 'mock';
  public readonly classifierVersion = 'mock-1.0.0';

  public async classify(input: ClassifierInput): Promise<Classification> {
    // Deterministic selection based on SHA-256 hash of image bytes
    const hash = crypto.createHash('sha256').update(input.bytes).digest('hex');
    const index = parseInt(hash.slice(0, 8), 16) % fixturesData.length;
    return fixturesData[index].classification as Classification;
  }

  public getByFixtureId(fixtureId: string): Classification | null {
    const fixture = fixturesData.find((f) => f.id === fixtureId);
    if (!fixture) return null;
    return fixture.classification as Classification;
  }
}

export const mockProvider = new MockClassifierProvider();
