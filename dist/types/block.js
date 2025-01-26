"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockCardSize = exports.BlockType = void 0;
var BlockType;
(function (BlockType) {
    BlockType["LINK"] = "LINK";
    BlockType["POLL"] = "POLL";
    BlockType["PRODUCT"] = "PRODUCT";
    BlockType["SEPARATOR"] = "Separator";
    BlockType["HEADING"] = "HEADING";
})(BlockType || (exports.BlockType = BlockType = {}));
var BlockCardSize;
(function (BlockCardSize) {
    BlockCardSize["NA"] = "NA";
    BlockCardSize["SMALL"] = "Small";
    BlockCardSize["MEDIUM"] = "Medium";
    BlockCardSize["LARGE"] = "Large";
})(BlockCardSize || (exports.BlockCardSize = BlockCardSize = {}));
