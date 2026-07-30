import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      campaign_id,
      campaign_status,
      robot_name,
      robot_status,
      last_error,
      total_target,
      total_sent,
      total_failed,
    } = body;

    console.log("n8n-status-update payload received:", body);

    // 1. Update Campaign if campaign_id is provided
    if (campaign_id) {
      const updateData: any = {};
      if (campaign_status) {
        updateData.status = campaign_status;
        if (campaign_status === "DONE" || campaign_status === "FAILED") {
          updateData.finishedAt = new Date();
        }
      }
      if (typeof total_target === "number") updateData.totalTarget = total_target;
      if (typeof total_sent === "number") updateData.totalSent = total_sent;
      if (typeof total_failed === "number") updateData.totalFailed = total_failed;

      await db.campaign.update({
        where: { campaignId: campaign_id },
        data: updateData,
      });
    }

    // 2. Update Robot Status if robot_name is provided
    if (robot_name) {
      const updateData: any = {};
      if (robot_status) updateData.status = robot_status;
      if (typeof total_target === "number") updateData.totalTarget = total_target;
      if (typeof total_sent === "number") updateData.totalSent = total_sent;
      if (typeof total_failed === "number") updateData.totalFailed = total_failed;
      
      // If setting to IDLE or ERROR, reset counters to 0 or appropriate values
      if (robot_status === "IDLE") {
        updateData.totalTarget = 0;
        updateData.totalSent = 0;
        updateData.totalFailed = 0;
        updateData.currentCampaign = null;
      }
      
      if (last_error !== undefined) {
        updateData.lastError = last_error;
      }

      await db.robotStatus.update({
        where: { robotName: robot_name },
        data: updateData,
      });
    }

    return NextResponse.json({ success: true, message: "Status updated successfully" });
  } catch (error: any) {
    console.error("Error in n8n-status-update route:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update status" },
      { status: 500 }
    );
  }
}
