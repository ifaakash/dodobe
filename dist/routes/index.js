"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiRouter = void 0;
const express_1 = require("express");
const auth_1 = require("./auth");
const dodoPage_1 = require("./dodoPage");
const block_1 = require("./block");
const router = (0, express_1.Router)();
exports.apiRouter = router;
// API version prefix
const v1Router = (0, express_1.Router)();
v1Router.use("/auth", auth_1.authRouter);
v1Router.use("/dodo-pages", dodoPage_1.dodoPageRouter);
v1Router.use("/blocks", block_1.blockRouter); // Simple and direct
router.use("/api/v1", v1Router);
