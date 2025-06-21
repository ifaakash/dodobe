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
        content: `Analyze this Instagram analytics screenshot for content metrics. 
      
      IMPORTANT: If this screenshot does not show Instagram content analytics/insights (posts, likes, comments, media count), return exactly:
      { "error": "Invalid screenshot for content analytics" }
      
      Otherwise, extract and return ONLY these fields in JSON format:
      {
        "mediaCount": number,
        "engagement": number,
        "avgLikes": number,
        "avgComments": number
      }`,
        gender: `Analyze this Instagram demographics screenshot for gender distribution.
      
      IMPORTANT: If this screenshot does not show Instagram gender demographics/audience insights, return exactly:
      { "error": "Invalid screenshot for gender analytics" }
      
      Otherwise, extract and return ONLY these fields in JSON format:
      {
        "malePercentage": number,
        "femalePercentage": number
      }`,
        age: `Analyze this Instagram demographics screenshot for age distribution.
      
      IMPORTANT: If this screenshot does not show Instagram age demographics/audience insights, return exactly:
      { "error": "Invalid screenshot for age analytics" }
      
      Otherwise, extract and return ONLY in this JSON format:
      {
        "ageGroups": { "25-34": 63.2, "18-24": 21.7, "35-44": 12.5, "13-17": 2.6 }
      }
      Use the exact age ranges shown in the screenshot. Return percentages as numbers without % symbol.`,
        location: `Analyze this Instagram demographics screenshot for location distribution.
      
      IMPORTANT: If this screenshot does not show Instagram location/country demographics/audience insights, return exactly:
      { "error": "Invalid screenshot for location analytics" }
      
      Otherwise, extract and return ONLY in this JSON format:
      {
        "locations": { "United States": 45.2, "India": 23.8, "United Kingdom": 15.6, "Canada": 8.4 }
      }
      Use the exact location names shown in the screenshot. Return percentages as numbers without % symbol.`,
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

            // Parse the JSON response - handle markdown code blocks
            try {
                // Extract JSON from markdown code blocks if present
                let jsonString = generatedContent.trim();

                // Check if response is wrapped in markdown code blocks
                const codeBlockMatch = jsonString.match(
                    /```(?:json)?\s*([\s\S]*?)\s*```/
                );
                if (codeBlockMatch) {
                    jsonString = codeBlockMatch[1].trim();
                }

                logger.info(`Extracted JSON string for ${type}:`, jsonString);

                const parsedData = JSON.parse(jsonString);
                return parsedData;
            } catch (parseError) {
                logger.error("Error parsing Gemini API response:", parseError);
                logger.error("Raw content:", generatedContent);
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
