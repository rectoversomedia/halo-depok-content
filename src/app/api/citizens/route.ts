import { NextRequest, NextResponse } from 'next/server';
import { submitCitizenReport } from '@/modules/citizens';

// POST /api/citizens - Submit citizen report
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, locationText, coordinates, reporterIp } = body;

    if (!text && !locationText) {
      return NextResponse.json({ error: 'Text or location is required' }, { status: 400 });
    }

    // Validate file uploads if any
    // Note: Don't send sensitive personal data to AI
    const sanitizedIp = reporterIp
      ? reporterIp.split('.').slice(0, 2).join('.') + '.xxx'
      : undefined;

    const report = await submitCitizenReport({
      text,
      locationText,
      coordinates: coordinates ?? undefined,
      reporterIp: sanitizedIp,
    });

    return NextResponse.json({
      success: true,
      reportId: report.id,
      message: 'Report submitted. Thank you for being a sensor for HaloDepok.',
    });
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error }, { status: 500 });
  }
}
