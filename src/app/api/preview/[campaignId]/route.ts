import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    const { campaignId } = await params;

    const campaign = await db.campaign.findUnique({
      where: { campaignId },
      select: { content: true }
    });

    if (!campaign) {
      return new NextResponse("Campaign tidak ditemukan.", { status: 404 });
    }

    return new NextResponse(campaign.content, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Error generating preview:", error);
    return new NextResponse("Gagal memuat pratinjau.", { status: 500 });
  }
}
