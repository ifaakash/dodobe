import { AnalyticsType } from "@/types/mediakit";
import { logger } from "./logger";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const AI_API_KEY = process.env.AI_API_KEY;

if (!AI_API_KEY) {
    throw new Error("AI_API_KEY is not configured in environment variables");
}

export class GeminiService {
    private static readonly PROMPTS = {
        content: `Analyze this Instagram analytics screenshot for content metrics. Extract and return ONLY these fields in JSON format:
      {
        "mediaCount": number,
        "engagement": number,
        "avgLikes": number,
        "avgComments": number
      }`,
        gender: `Analyze this Instagram demographics screenshot for gender distribution. Extract and return ONLY these fields in JSON format:
      {
        "malePercentage": number,
        "femalePercentage": number
      }`,
        age: `Analyze this Instagram demographics screenshot for age distribution. Extract and return ONLY these fields in JSON format:
      {
        "15-24": number,
        "25-34": number,
        "35-44": number,
        "45-54": number
      }`,
        location: `Analyze this Instagram demographics screenshot for location distribution. Extract and return in JSON format:
      {
        "locations": { "location1": percentage, "location2": percentage, ... }
      }`,
    };

    static async extractAnalytics(imageBase64: string, type: AnalyticsType) {
        try {
            const prompt = this.PROMPTS[type];

            const body = {
                contents: [
                    {
                        parts: [
                            {
                                inline_data: {
                                    mime_type: "image/jpeg",
                                    data: imageBase64,
                                },
                            },
                            {
                                text: prompt,
                            },
                        ],
                    },
                ],
            };

            logger.info(`Making request to Gemini API for ${type} analytics`);

            const response = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${AI_API_KEY}`,
                body,
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            logger.info(
                `Received response from Gemini API for ${type} analytics:`,
                response.data
            );

            const generatedContent =
                response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!generatedContent) {
                throw new Error(
                    "No content generated from Gemini API response"
                );
            }

            // Parse the JSON response
            try {
                const parsedData = JSON.parse(generatedContent);
                return parsedData;
            } catch (parseError) {
                logger.error("Error parsing Gemini API response:", parseError);
                throw new Error("Invalid JSON response from Gemini API");
            }
        } catch (error) {
            logger.error(`Error extracting ${type} analytics:`, error);
            throw error instanceof Error
                ? error
                : new Error(
                      "Unknown error occurred while extracting analytics"
                  );
        }
    }
}
