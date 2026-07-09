"use server";

import { db } from "@/lib/db";

export async function getDashboardStatsAction() {
  try {
    // 1. Fetch campaigns data
    const allCampaigns = await db.campaign.findMany({
      select: {
        id: true,
        status: true,
        totalTarget: true,
        totalSent: true,
        totalFailed: true,
        name: true,
      }
    });

    const totalCampaigns = allCampaigns.length;
    let draftCampaigns = 0;
    let activeCampaigns = 0;
    let sentCampaigns = 0;
    
    let totalTarget = 0;
    let totalSent = 0;
    let totalFailed = 0;

    allCampaigns.forEach(c => {
      const status = (c.status || "DRAFT").toUpperCase();
      if (status === "DRAFT") {
        draftCampaigns++;
      } else if (status === "RUNNING" || status === "SENDING" || status === "ACTIVE") {
        activeCampaigns++;
      } else {
        sentCampaigns++;
      }
      totalTarget += c.totalTarget || 0;
      totalSent += c.totalSent || 0;
      totalFailed += c.totalFailed || 0;
    });

    // 2. Fetch robot status
    const allRobots = await db.$queryRawUnsafe<any[]>(
      `SELECT status FROM robot_status`
    );

    const totalRobots = allRobots.length;
    let runningRobots = 0;
    let idleRobots = 0;
    let errorRobots = 0;

    allRobots.forEach(r => {
      const status = (r.status || "IDLE").toUpperCase();
      if (status === "RUNNING") {
        runningRobots++;
      } else if (status === "ERROR") {
        errorRobots++;
      } else {
        idleRobots++;
      }
    });

    // 3. Filter top 5 campaigns for target/sent/failed stats
    // We sort by id desc (newest campaigns) so they represent recent activity
    const sortedCampaigns = [...allCampaigns].sort((a, b) => b.id - a.id);
    const topCampaigns = sortedCampaigns
      .slice(0, 5)
      .map(c => {
        const target = c.totalTarget || 0;
        const sent = c.totalSent || 0;
        const failed = c.totalFailed || 0;
        const successRate = target > 0 ? Math.round((sent / target) * 100) : 0;
        return {
          id: c.id,
          name: c.name,
          totalTarget: target,
          totalSent: sent,
          totalFailed: failed,
          successRate,
        };
      });

    return {
      success: true,
      stats: {
        campaigns: {
          total: totalCampaigns,
          draft: draftCampaigns,
          active: activeCampaigns,
          sent: sentCampaigns,
        },
        delivery: {
          totalTarget,
          totalSent,
          totalFailed,
          successRate: totalTarget > 0 ? Math.round((totalSent / totalTarget) * 100) : 0,
          failedRate: totalTarget > 0 ? Math.round((totalFailed / totalTarget) * 100) : 0,
        },
        robots: {
          total: totalRobots,
          running: runningRobots,
          idle: idleRobots,
          error: errorRobots,
          activeRate: totalRobots > 0 ? Math.round((runningRobots / totalRobots) * 100) : 0,
        },
        topCampaigns,
      }
    };
  } catch (error) {
    console.error("Failed to get dashboard stats:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
