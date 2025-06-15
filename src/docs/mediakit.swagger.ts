/**
 * @swagger
 * components:
 *   schemas:
 *     MediaKit:
 *       type: object
 *       required:
 *         - instaId
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the media kit
 *         userId:
 *           type: string
 *           description: The id of the user who owns this media kit
 *         instaId:
 *           type: string
 *           description: The Instagram ID of the creator
 *         isVerified:
 *           type: boolean
 *           description: Whether the media kit is verified
 *         followers:
 *           type: number
 *           description: Number of followers
 *         following:
 *           type: number
 *           description: Number of following
 *         grade:
 *           type: string
 *           description: The grade/rating of the media kit
 *         brandCollabs:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/BrandCollab'
 *         contentAnalytics:
 *           type: object
 *           properties:
 *             mediaCount:
 *               type: number
 *               description: Number of media posts
 *             engagement:
 *               type: number
 *               description: Engagement rate
 *             avgLikes:
 *               type: number
 *               description: Average likes per post
 *             avgComments:
 *               type: number
 *               description: Average comments per post
 *             uploadedAt:
 *               type: string
 *               format: date-time
 *               description: When the analytics were last updated
 *         genderAnalytics:
 *           type: object
 *           properties:
 *             malePercentage:
 *               type: number
 *               description: Percentage of male followers
 *             femalePercentage:
 *               type: number
 *               description: Percentage of female followers
 *             uploadedAt:
 *               type: string
 *               format: date-time
 *               description: When the analytics were last updated
 *         ageAnalytics:
 *           type: object
 *           properties:
 *             "15-24":
 *               type: number
 *               description: Percentage of followers aged 15-24
 *             "25-34":
 *               type: number
 *               description: Percentage of followers aged 25-34
 *             "35-44":
 *               type: number
 *               description: Percentage of followers aged 35-44
 *             "45-54":
 *               type: number
 *               description: Percentage of followers aged 45-54
 *             uploadedAt:
 *               type: string
 *               format: date-time
 *               description: When the analytics were last updated
 *         locationAnalytics:
 *           type: object
 *           properties:
 *             locations:
 *               type: object
 *               additionalProperties:
 *                 type: number
 *               description: Map of locations to follower percentages
 *             uploadedAt:
 *               type: string
 *               format: date-time
 *               description: When the analytics were last updated
 *
 *     BrandCollab:
 *       type: object
 *       required:
 *         - brandName
 *         - contentType
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the brand collaboration
 *         brandName:
 *           type: string
 *           description: Name of the brand
 *         contentType:
 *           type: string
 *           description: Type of content created
 *         contentUrl:
 *           type: string
 *           description: URL of the content
 *         reach:
 *           type: string
 *           description: Reach of the collaboration
 *         engagement:
 *           type: string
 *           description: Engagement metrics
 *
 *     Error:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: Error message
 *         error:
 *           type: string
 *           example: Detailed error message
 */

/**
 * @swagger
 * tags:
 *   name: MediaKit
 *   description: Media kit management API
 */

/**
 * @swagger
 * /api/v1/mediakit/link-mediakit-to-user:
 *   post:
 *     summary: Link a media kit to a user
 *     tags: [MediaKit]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - instaId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: The ID of the user
 *               instaId:
 *                 type: string
 *                 description: The Instagram ID
 *     responses:
 *       200:
 *         description: Media kit linked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: MediaKit linked to user successfully
 *                 data:
 *                   $ref: '#/components/schemas/MediaKit'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Conflict (user already has media kit or media kit already linked)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/v1/mediakit/create:
 *   post:
 *     summary: Create a new media kit
 *     tags: [MediaKit]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required:
 *               - instaId
 *               - followers
 *               - avgLikes
 *               - avgComments
 *             properties:
 *               instaId:
 *                 type: string
 *                 description: The Instagram ID
 *               followers:
 *                 type: number
 *                 description: Number of followers
 *               following:
 *                 type: number
 *                 description: Number of following
 *               mediaCount:
 *                 type: number
 *                 description: Number of media posts
 *               avgLikes:
 *                 type: number
 *                 description: Average likes per post
 *               avgComments:
 *                 type: number
 *                 description: Average comments per post
 *               grade:
 *                 type: string
 *                 description: The grade/rating of the media kit
 *               isVerified:
 *                 type: boolean
 *                 description: Whether the media kit is verified
 *     responses:
 *       201:
 *         description: Media kit created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: MediaKit created successfully
 *                 data:
 *                   $ref: '#/components/schemas/MediaKit'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Media kit already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/v1/mediakit/add-brand-collab:
 *   post:
 *     summary: Add a brand collaboration to a media kit
 *     tags: [MediaKit]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - instaId
 *               - brandName
 *               - contentType
 *             properties:
 *               instaId:
 *                 type: string
 *                 description: The Instagram ID
 *               brandName:
 *                 type: string
 *                 description: Name of the brand
 *               contentType:
 *                 type: string
 *                 description: Type of content created
 *               contentUrl:
 *                 type: string
 *                 description: URL of the content
 *               reach:
 *                 type: string
 *                 description: Reach of the collaboration
 *               engagement:
 *                 type: string
 *                 description: Engagement metrics
 *     responses:
 *       200:
 *         description: Brand collaboration added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Brand collaboration added successfully
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Media kit not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/v1/mediakit/get-by-instaId/{instaId}:
 *   get:
 *     summary: Get media kit details by Instagram ID
 *     tags: [MediaKit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: instaId
 *         schema:
 *           type: string
 *         required: true
 *         description: Instagram ID of the creator
 *     responses:
 *       200:
 *         description: Media kit details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/MediaKit'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Media kit not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/v1/mediakit/verify:
 *   post:
 *     summary: Verify a media kit
 *     tags: [MediaKit]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - instaId
 *               - userId
 *             properties:
 *               instaId:
 *                 type: string
 *                 description: Instagram ID of the creator
 *               userId:
 *                 type: string
 *                 description: UserID of the user(from dodo username)
 *     responses:
 *       200:
 *         description: Media kit verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: MediaKit verified successfully
 *                 data:
 *                   $ref: '#/components/schemas/MediaKit'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Media kit not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/v1/mediakit/is-verified/{instaId}:
 *   get:
 *     summary: Check if a media kit is verified
 *     tags: [MediaKit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: instaId
 *         schema:
 *           type: string
 *         required: true
 *         description: Instagram ID of the creator
 *     responses:
 *       200:
 *         description: Verification status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     isVerified:
 *                       type: boolean
 *                       description: Whether the media kit is verified
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Media kit not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/v1/mediakit/update:
 *   patch:
 *     summary: Update a media kit
 *     tags: [MediaKit]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - instaId
 *             properties:
 *               instaId:
 *                 type: string
 *                 description: The Instagram ID of the media kit to update
 *               followers:
 *                 type: number
 *                 description: Number of followers
 *               following:
 *                 type: number
 *                 description: Number of following
 *               mediaCount:
 *                 type: number
 *                 description: Number of media posts
 *               avgLikes:
 *                 type: number
 *                 description: Average likes per post
 *               avgComments:
 *                 type: number
 *                 description: Average comments per post
 *               isVerified:
 *                 type: boolean
 *                 description: Whether the media kit is verified
 *     responses:
 *       200:
 *         description: Media kit updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: MediaKit updated successfully
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Media kit not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
