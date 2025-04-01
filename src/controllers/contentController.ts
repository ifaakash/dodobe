import { Request, Response } from "express";
import {
    ContentGenerationRequest,
    ContentGenerationResponse,
    ContentGenerationResponseError,
} from "../types/content";
import { Post } from "../utils/api";
import { logger } from "../utils/logger";
import dotenv from "dotenv";

dotenv.config();

export const generateContent = async (
    req: Request<{}, {}, ContentGenerationRequest>,
    res: Response<ContentGenerationResponse | ContentGenerationResponseError>
) => {
    try {
        const { prompt, category, additionalDetails } = req.body;
        if (!prompt || !category) {
            return res
                .status(400)
                .json({
                    content: "",
                    error: "Prompt and category are required",
                });
        }
        const AI_API_KEY = process.env.AI_API_KEY;

        if (!AI_API_KEY) {
            logger.error("AI API key not configured");
            return res
                .status(500)
                .json({ content: "", error: "AI API key not configured" });
        }

        // Construct a more detailed prompt based on the category and additional details
        const enhancedPrompt = `
      Category: ${category}
      ${
          additionalDetails
              ? `Additional Details: ${JSON.stringify(
                    additionalDetails,
                    null,
                    2
                )}`
              : ""
      }
      User Request: ${prompt}
      
      Please generate appropriate content based on the above details.
    `;

        const body = {
            contents: [
                {
                    parts: [
                        {
                            text: enhancedPrompt,
                        },
                    ],
                },
            ],
        };

        logger.info("Making request to Gemini API with body:", body);

        const response = await Post<any>(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${AI_API_KEY}`,
            body
        );

        logger.info("Received response from Gemini API:", response);

        const generatedContent =
            response?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!generatedContent) {
            logger.error(
                "No content generated from Gemini API response:",
                response
            );
            return res
                .status(500)
                .json({ content: "", error: "Failed to generate content" });
        }

        return res.status(200).json({ content: generatedContent });
    } catch (error) {
        logger.error("Error with AI API:", error);
        return res.status(500).json({
            content: "",
            error:
                error instanceof Error
                    ? error.message
                    : "Internal server error",
        });
    }
};
