import { AnalyticsType } from "@/types/mediakit";
import { logger } from "./logger";

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
        // ... reuse existing Gemini API call logic from contentController.ts
        // but with type-specific prompts and response parsing
    }
}
