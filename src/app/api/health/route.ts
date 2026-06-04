import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    app: process.env.APP_NAME || "demoapp",
    timestamp: new Date().toISOString()
  });
}
