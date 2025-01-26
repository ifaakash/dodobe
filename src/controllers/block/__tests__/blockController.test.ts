import request from "supertest";
import { app } from "../../../app";
import {
    UserModel,
    DodoPageModel,
    BlockModel,
    LinkBlockModel,
    PollBlockModel,
} from "../../../models";
import { BlockType, BlockCardSize } from "../../../types/block";
import { Types } from "mongoose";

describe("BlockController", () => {
    let userId: string;
    let dodoPageId: string;

    beforeEach(async () => {
        // Create test user
        const user = await UserModel.create({
            mobileNumber: "+919876543210",
            otplessId: "test-otpless-id",
            name: "Test User",
        });
        userId = (user._id as Types.ObjectId).toString();

        // Create test DodoPage
        const dodoPage = await DodoPageModel.create({
            userId: user._id,
            name: "Test Page",
            url: "test-page",
            socialLinks: {},
            blocks: [], // Initialize empty blocks array
        });
        dodoPageId = (dodoPage._id as Types.ObjectId).toString();
    });

    describe("POST /api/v1/block/create", () => {
        it("should create a link block", async () => {
            const response = await request(app)
                .post("/api/v1/block/create")
                .send({
                    dodoPageId,
                    blockType: BlockType.LINK,
                    blockCardSize: BlockCardSize.MEDIUM,
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
            const block = await BlockModel.findById(response.body.block.id);
            expect(block).toBeDefined();
            expect(block?.blockType).toBe(BlockType.LINK);

            // Verify link block data
            const linkBlock = await LinkBlockModel.findOne({
                blockId: response.body.block.id,
            });
            expect(linkBlock).toBeDefined();
            expect(linkBlock?.title).toBe("Test Link");
        });

        it("should create a poll block", async () => {
            const response = await request(app)
                .post("/api/v1/block/create")
                .send({
                    dodoPageId,
                    blockType: BlockType.POLL,
                    blockCardSize: BlockCardSize.LARGE,
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
            const createResponse = await request(app)
                .post("/api/v1/block/create")
                .send({
                    dodoPageId,
                    blockType: BlockType.HEADING,
                    blockCardSize: BlockCardSize.SMALL,
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
            const response = await request(app)
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
            const block1 = await BlockModel.create({
                dodoPageId: new Types.ObjectId(dodoPageId),
                blockType: BlockType.HEADING,
                blockCardSize: BlockCardSize.SMALL,
                blockPositionalIndex: 0,
            });

            const block2 = await BlockModel.create({
                dodoPageId: new Types.ObjectId(dodoPageId),
                blockType: BlockType.LINK,
                blockCardSize: BlockCardSize.MEDIUM,
                blockPositionalIndex: 1,
            });

            // export interface ReorderBlocksRequest {
            //     dodoPageId: string;
            //     blocks: Array<{
            //         blockId: string;
            //         newIndex: number;
            //     }>;
            // }
            const response = await request(app)
                .post("/api/v1/block/reorder")
                .send({
                    dodoPageId,
                    blocks: [
                        {
                            blockId: (block1._id as Types.ObjectId).toString(),
                            newIndex: 1,
                        },
                        {
                            blockId: (block2._id as Types.ObjectId).toString(),
                            newIndex: 0,
                        },
                    ],
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);

            // Verify new order
            const updatedBlock1 = await BlockModel.findById(block1._id);
            const updatedBlock2 = await BlockModel.findById(block2._id);
            expect(updatedBlock1?.blockPositionalIndex).toBe(1);
            expect(updatedBlock2?.blockPositionalIndex).toBe(0);
        });
    });
});
