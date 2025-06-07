"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = require("../../../app");
const models_1 = require("../../../models");
const block_1 = require("../../../types/block");
const mongoose_1 = require("mongoose");
describe("BlockController", () => {
    let userId;
    let dodoPageId;
    beforeEach(async () => {
        // Create test user
        const user = await models_1.UserModel.create({
            mobileNumber: "+919876543210",
            firebaseUid: "test-firebaseUid-id",
            name: "Test User",
        });
        userId = user._id.toString();
        // Create test DodoPage
        const dodoPage = await models_1.DodoPageModel.create({
            userId: user._id,
            name: "Test Page",
            url: "test-page",
            socialLinks: {},
            blocks: [], // Initialize empty blocks array
        });
        dodoPageId = dodoPage._id.toString();
    });
    describe("POST /api/v1/block/create", () => {
        it("should create a link block", async () => {
            const response = await (0, supertest_1.default)(app_1.app)
                .post("/api/v1/block/create")
                .send({
                dodoPageId,
                blockType: block_1.BlockType.LINK,
                blockCardSize: block_1.BlockCardSize.MEDIUM,
                blockData: {
                    title: "Test Link",
                    url: "https://test.com",
                    description: "Test Description",
                },
            });
            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.block.id).toBeDefined();
            // Verify block was created
            const block = await models_1.BlockModel.findById(response.body.block.id);
            expect(block).toBeDefined();
            expect(block?.blockType).toBe(block_1.BlockType.LINK);
            // Verify link block data
            const linkBlock = await models_1.LinkBlockModel.findOne({
                blockId: response.body.block.id,
            });
            expect(linkBlock).toBeDefined();
            expect(linkBlock?.title).toBe("Test Link");
        });
        it("should create a poll block", async () => {
            const response = await (0, supertest_1.default)(app_1.app)
                .post("/api/v1/block/create")
                .send({
                dodoPageId,
                blockType: block_1.BlockType.POLL,
                blockCardSize: block_1.BlockCardSize.LARGE,
                blockData: {
                    question: "Test Poll?",
                    options: ["Option 1", "Option 2"],
                },
            });
            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
        });
    });
    describe("PATCH /api/v1/block/update/:blockId", () => {
        it("should update a block", async () => {
            // First create a block
            const createResponse = await (0, supertest_1.default)(app_1.app)
                .post("/api/v1/block/create")
                .send({
                dodoPageId,
                blockType: block_1.BlockType.HEADING,
                blockCardSize: block_1.BlockCardSize.SMALL,
                blockData: {
                    title: "Original Heading",
                },
            });
            expect(createResponse.status).toBe(201);
            expect(createResponse.body.success).toBe(true);
            expect(createResponse.body.block).toBeDefined();
            const blockId = createResponse.body.block.id;
            expect(blockId).toBeDefined();
            // Update the block
            const response = await (0, supertest_1.default)(app_1.app)
                .patch(`/api/v1/block/update/${blockId}`)
                .send({
                blockData: {
                    title: "Updated Heading",
                },
            });
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.block.blockData.title).toBe("Updated Heading");
        });
    });
    describe("POST /api/v1/block/reorder", () => {
        it("should reorder blocks", async () => {
            // Create multiple blocks
            const block1 = await models_1.BlockModel.create({
                dodoPageId: new mongoose_1.Types.ObjectId(dodoPageId),
                blockType: block_1.BlockType.HEADING,
                blockCardSize: block_1.BlockCardSize.SMALL,
                blockPositionalIndex: 0,
            });
            const block2 = await models_1.BlockModel.create({
                dodoPageId: new mongoose_1.Types.ObjectId(dodoPageId),
                blockType: block_1.BlockType.LINK,
                blockCardSize: block_1.BlockCardSize.MEDIUM,
                blockPositionalIndex: 1,
            });
            // export interface ReorderBlocksRequest {
            //     dodoPageId: string;
            //     blocks: Array<{
            //         blockId: string;
            //         newIndex: number;
            //     }>;
            // }
            const response = await (0, supertest_1.default)(app_1.app)
                .post("/api/v1/block/reorder")
                .send({
                dodoPageId,
                blocks: [
                    {
                        blockId: block1._id.toString(),
                        newIndex: 1,
                    },
                    {
                        blockId: block2._id.toString(),
                        newIndex: 0,
                    },
                ],
            });
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            // Verify new order
            const updatedBlock1 = await models_1.BlockModel.findById(block1._id);
            const updatedBlock2 = await models_1.BlockModel.findById(block2._id);
            expect(updatedBlock1?.blockPositionalIndex).toBe(1);
            expect(updatedBlock2?.blockPositionalIndex).toBe(0);
        });
    });
});
