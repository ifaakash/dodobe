"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockCardSize = exports.SeparatorType = exports.BlockType = void 0;
var BlockType;
(function (BlockType) {
    BlockType["LINK"] = "LINK";
    BlockType["POLL"] = "POLL";
    BlockType["PRODUCT"] = "PRODUCT";
    BlockType["SEPARATOR"] = "SEPARATOR";
    BlockType["HEADING"] = "HEADING";
})(BlockType || (exports.BlockType = BlockType = {}));
var SeparatorType;
(function (SeparatorType) {
    SeparatorType["DASHED_LINE"] = "dashed-line";
    SeparatorType["SOLID_LINE"] = "solid-line";
    SeparatorType["OR"] = "or";
})(SeparatorType || (exports.SeparatorType = SeparatorType = {}));
var BlockCardSize;
(function (BlockCardSize) {
    BlockCardSize["NA"] = "NA";
    BlockCardSize["SMALL"] = "SMALL";
    BlockCardSize["MEDIUM"] = "MEDIUM";
    BlockCardSize["LARGE"] = "LARGE";
})(BlockCardSize || (exports.BlockCardSize = BlockCardSize = {}));
