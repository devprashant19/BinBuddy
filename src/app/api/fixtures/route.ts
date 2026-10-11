import { NextResponse } from 'next/server';
import fixturesData from '../../../../data/fixtures/classification-fixtures.json';

export const dynamic = 'force-dynamic';

export async function GET() {
  const publicFixtures = fixturesData.map((f) => ({
    id: f.id,
    label: f.label,
    description: f.description,
  }));

  return NextResponse.json(publicFixtures);
}
