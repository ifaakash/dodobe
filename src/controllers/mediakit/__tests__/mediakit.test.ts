import request from "supertest";
import { app } from "../../../app"; // adjust path if needed
import { MediaKitModel } from "../../../models/mediakit/model";

// Mock the model
jest.mock("../src/models/mediakit/model");

const mockMediaKit = {
  instaId: "some-id",
  linkUrl: "https://example.com",
  isVerified: true,
};

describe("MediaKitController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /verify", () => {
    it("should save verification data", async () => {
      (MediaKitModel.findOneAndUpdate as jest.Mock).mockResolvedValue(mockMediaKit);

      const response = await request(app).post("/verify").send({
        instaId: "some-id",
        linkUrl: "https://example.com",
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("should return 400 if data is missing", async () => {
      const response = await request(app).post("/verify").send({ instaId: "" });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /isverified", () => {
    it("should return verified status", async () => {
      (MediaKitModel.findOne as jest.Mock).mockResolvedValue(mockMediaKit);

      const response = await request(app).get("/isverified").query({ instaId: "some-id" });

      expect(response.status).toBe(200);
      expect(response.body.isVerified).toBe(true);
    });

    it("should return 404 if not found", async () => {
      (MediaKitModel.findOne as jest.Mock).mockResolvedValue(null);

      const response = await request(app).get("/isverified").query({ instaId: "not-found" });

      expect(response.status).toBe(404);
    });
  });

  describe("GET /details", () => {
    it("should return full media kit data", async () => {
      (MediaKitModel.findOne as jest.Mock).mockResolvedValue(mockMediaKit);

      const response = await request(app).get("/details").query({ instaId: "some-id" });

      expect(response.status).toBe(200);
      expect(response.body.data.instaId).toBe("some-id");
    });

    it("should return 400 if instaId is missing", async () => {
      const response = await request(app).get("/details").query({});

      expect(response.status).toBe(400);
    });
  });
});
