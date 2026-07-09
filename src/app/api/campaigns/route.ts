import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// ── GET /api/campaigns ────────────────────────────────────────────────────────
export async function GET() {
  try {
    const campaigns = await db.campaign.findMany({
      orderBy: { id: "desc" },
      select: {
        id: true,
        campaignId: true,
        name: true,
        subject: true,
        content: true,
        status: true,
      }
    });
    return NextResponse.json({ success: true, data: campaigns });
  } catch (err) {
    console.error("GET /api/campaigns error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch campaigns" },
      { status: 500 }
    );
  }
}

// ── POST /api/campaigns ───────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      campaign_id: string;
      name: string;
      subject: string;
      content: string;
    };

    const { campaign_id, name, subject, content } = body;

    if (!campaign_id || !name || !subject || !content) {
      return NextResponse.json(
        { success: false, error: "All fields are required" },
        { status: 400 }
      );
    }

    // Check campaign_id uniqueness
    const existing = await db.campaign.findUnique({
      where: { campaignId: campaign_id },
      select: { campaignId: true }
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: `Campaign ID "${campaign_id}" already exists` },
        { status: 409 }
      );
    }

    const campaign = await db.campaign.create({
      data: {
        campaignId: campaign_id,
        name,
        subject,
        content,
        status: "DRAFT",
      },
      select: {
        id: true,
        campaignId: true,
        name: true,
        subject: true,
        content: true,
        status: true,
      }
    });

    return NextResponse.json(
      { success: true, data: campaign },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/campaigns error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to create campaign" },
      { status: 500 }
    );
  }
}
