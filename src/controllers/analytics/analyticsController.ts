import { Request, Response } from "express";
import {
    PageViewModel,
    BlockInteractionModel,
} from "../../models/analytics/model";
import { DodoPageModel } from "../../models";
import { BlockModel } from "../../models";
import { logger } from "../../utils/logger";
import { parseUserAgent } from "../../utils/userAgent";
import {
    RecordPageViewRequest,
    RecordPageViewResponse,
    RecordBlockInteractionRequest,
    RecordBlockInteractionResponse,
    RecordTimeSpentRequest,
    GetDodoPageAnalyticsRequest,
    GetDodoPageAnalyticsResponse,
} from "../../types/analytics";
import { ID } from "@/types/common";

export class AnalyticsController {
    /**
     * Record a page view
     */
    public static async recordPageView(
        req: Request<{}, {}, RecordPageViewRequest>,
        res: Response<RecordPageViewResponse>
    ): Promise<void> {
        try {
            const { dodoPageId, visitorId, referrer, sessionId } = req.body;

            // Check if the DodoPage exists
            const dodoPage = await DodoPageModel.findById(dodoPageId);
            if (!dodoPage) {
                res.status(404).json({
                    success: false,
                    message: "DodoPage not found",
                });
                return;
            }

            // Parse user agent
            const userAgentInfo = parseUserAgent(
                req.headers["user-agent"] || ""
            );

            // Create page view record
            const pageView = await PageViewModel.create({
                dodoPageId,
                visitorId,
                referrer,
                userAgent: req.headers["user-agent"],
                ipAddress:
                    req.ip ||
                    req.headers["x-forwarded-for"] ||
                    req.socket.remoteAddress,
                device: userAgentInfo.device,
                browser: userAgentInfo.browser,
                sessionId: sessionId || `${visitorId}-${Date.now()}`,
            });

            logger.info({
                type: "analytics",
                action: "page_view",
                dodoPageId,
                visitorId,
            });

            res.status(201).json({
                success: true,
                message: "Page view recorded",
                pageViewId: pageView._id,
            });
        } catch (error) {
            logger.error("Error in recordPageView:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error: " + error,
            });
        }
    }

    /**
     * Record a block interaction
     */
    public static async recordBlockInteraction(
        req: Request<{}, {}, RecordBlockInteractionRequest>,
        res: Response<RecordBlockInteractionResponse>
    ): Promise<void> {
        try {
            const {
                blockId,
                dodoPageId,
                visitorId,
                interactionType,
                sessionId,
            } = req.body;

            // Check if the Block exists
            const block = await BlockModel.findById(blockId);
            if (!block) {
                res.status(404).json({
                    success: false,
                    message: "Block not found",
                });
                return;
            }

            // Create interaction record
            const interaction = await BlockInteractionModel.create({
                blockId,
                dodoPageId,
                visitorId,
                interactionType,
                sessionId: sessionId || `${visitorId}-${Date.now()}`,
            });

            logger.info({
                type: "analytics",
                action: "block_interaction",
                blockId,
                dodoPageId,
                interactionType,
            });

            res.status(201).json({
                success: true,
                message: "Block interaction recorded",
                interactionId: interaction._id,
            });
        } catch (error) {
            logger.error("Error in recordBlockInteraction:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error: " + error,
            });
        }
    }

    /**
     * Record time spent on page via Beacon API
     */
    public static async recordTimeSpent(
        req: Request,
        res: Response
    ): Promise<void> {
        try {
            // For Beacon API, we may not be able to send a response
            // as the browser might have already unloaded the page

            // Parse the request body
            let data: RecordTimeSpentRequest;
            if (Buffer.isBuffer(req.body)) {
                // Handle raw buffer from Beacon API
                data = JSON.parse(req.body.toString());
            } else {
                // Handle already parsed JSON
                data = req.body;
            }

            const { dodoPageId, timeSpent, visitorId, sessionId } = data;

            // Validate required fields
            if (!dodoPageId || !timeSpent || !visitorId) {
                logger.error("Missing required fields for timeSpent tracking");
                res.status(400).end();
                return;
            }

            // Find existing page view to update duration
            if (sessionId) {
                await PageViewModel.findOneAndUpdate(
                    {
                        dodoPageId,
                        visitorId,
                        sessionId,
                    },
                    {
                        $set: { duration: timeSpent },
                    }
                );
            } else {
                // Create a new record if no session ID provided
                await PageViewModel.create({
                    dodoPageId,
                    visitorId,
                    duration: timeSpent,
                });
            }

            logger.info({
                type: "analytics",
                action: "time_spent",
                dodoPageId,
                visitorId,
                timeSpent,
            });

            // Send a 204 No Content response
            // Note: With Beacon API, the browser may not process this response
            res.status(204).end();
        } catch (error) {
            logger.error("Error in recordTimeSpent:", error);
            // Even for errors, we use 204 because Beacon API doesn't process responses
            res.status(204).end();
        }
    }

    /**
     * Get analytics for a DodoPage
     */
    public static async getDodoPageAnalytics(
        req: Request<{ dodoPageId: string }, {}, GetDodoPageAnalyticsRequest>,
        res: Response<GetDodoPageAnalyticsResponse>
    ): Promise<void> {
        try {
            const { dodoPageId } = req.params;
            const { timeframe = "week" } = req.body;

            // Check if the DodoPage exists
            const dodoPage = await DodoPageModel.findById(dodoPageId);
            if (!dodoPage) {
                res.status(404).json({
                    success: false,
                    message: "DodoPage not found",
                });
                return;
            }

            // Determine date range based on timeframe
            const endDate = new Date();
            let startDate = new Date();

            switch (timeframe) {
                case "day":
                    startDate.setDate(endDate.getDate() - 1);
                    break;
                case "week":
                    startDate.setDate(endDate.getDate() - 7);
                    break;
                case "month":
                    startDate.setMonth(endDate.getMonth() - 1);
                    break;
                case "year":
                    startDate.setFullYear(endDate.getFullYear() - 1);
                    break;
                default:
                    startDate.setDate(endDate.getDate() - 7); // Default to week
            }

            // Get page views
            const pageViews = await PageViewModel.find({
                dodoPageId,
                timestamp: { $gte: startDate, $lte: endDate },
            });

            // Get block interactions
            const blockInteractions = await BlockInteractionModel.find({
                dodoPageId,
                timestamp: { $gte: startDate, $lte: endDate },
            });

            // Calculate analytics
            const uniqueVisitors = new Set(
                pageViews.map((view) => view.visitorId)
            ).size;
            const totalViews = pageViews.length;

            // Calculate average duration (if available)
            let averageDuration = 0;
            const viewsWithDuration = pageViews.filter((view) => view.duration);
            if (viewsWithDuration.length > 0) {
                averageDuration =
                    viewsWithDuration.reduce(
                        (sum, view) => sum + (view.duration || 0),
                        0
                    ) / viewsWithDuration.length;
            }

            // Get top referrers
            const referrerCounts: Record<string, number> = {};
            pageViews.forEach((view) => {
                if (view.referrer) {
                    referrerCounts[view.referrer] =
                        (referrerCounts[view.referrer] || 0) + 1;
                }
            });

            const topReferrers = Object.entries(referrerCounts)
                .map(([source, count]) => ({ source, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);

            // Get block interactions summary
            const blockInteractionCounts: Record<
                string,
                { count: number; type: string }
            > = {};

            // Get all blocks for this page to have their types
            const blocks = await BlockModel.find({
                _id: { $in: dodoPage.blocks },
            });

            const blockTypesMap: Record<string, string> = {};
            blocks.forEach((block) => {
                blockTypesMap[(block._id as ID).toString()] = block.blockType;
            });

            blockInteractions.forEach((interaction) => {
                const blockIdStr = interaction.blockId.toString();
                if (!blockInteractionCounts[blockIdStr]) {
                    blockInteractionCounts[blockIdStr] = {
                        count: 0,
                        type: blockTypesMap[blockIdStr] || "unknown",
                    };
                }
                blockInteractionCounts[blockIdStr].count += 1;
            });

            const blockInteractionsSummary = Object.entries(
                blockInteractionCounts
            )
                .map(([blockId, data]) => ({
                    blockId,
                    blockType: data.type,
                    interactionCount: data.count,
                }))
                .sort((a, b) => b.interactionCount - a.interactionCount);

            // Get views by date
            const viewsByDate: Record<string, number> = {};
            pageViews.forEach((view) => {
                const dateStr = view.timestamp.toISOString().split("T")[0];
                viewsByDate[dateStr] = (viewsByDate[dateStr] || 0) + 1;
            });

            const viewsByDateArray = Object.entries(viewsByDate)
                .map(([date, count]) => ({ date, count }))
                .sort((a, b) => a.date.localeCompare(b.date));

            // Get device breakdown
            const deviceCounts: Record<string, number> = {};
            pageViews.forEach((view) => {
                if (view.device) {
                    deviceCounts[view.device] =
                        (deviceCounts[view.device] || 0) + 1;
                }
            });

            const deviceBreakdown = Object.entries(deviceCounts)
                .map(([device, count]) => ({
                    device,
                    percentage: (count / totalViews) * 100,
                }))
                .sort((a, b) => b.percentage - a.percentage);

            logger.info({
                type: "analytics",
                action: "get_analytics",
                dodoPageId,
                timeframe,
            });

            res.status(200).json({
                success: true,
                data: {
                    totalViews,
                    uniqueVisitors,
                    averageDuration,
                    topReferrers,
                    blockInteractions: blockInteractionsSummary,
                    viewsByDate: viewsByDateArray,
                    deviceBreakdown,
                },
            });
        } catch (error) {
            logger.error("Error in getDodoPageAnalytics:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error: " + error,
            });
        }
    }
}
