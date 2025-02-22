import { Schema } from "mongoose";
import { IUser, IUserInterestCategory, IDodoPage } from "../../types/user";

const userSchema = new Schema<IUser>(
    {
        name: { type: String },
        mobileNumber: { type: String, required: true },
        otplessId: { type: String, unique: true, sparse: true },
        dodoPages: [{ type: Schema.Types.ObjectId, ref: "DodoPage" }],
        interestCategories: [
            { type: Schema.Types.ObjectId, ref: "UserInterestCategory" },
        ],
        bankDetails: [{ type: Schema.Types.ObjectId, ref: "BankDetail" }],
        invoices: [{ type: Schema.Types.ObjectId, ref: "Invoice" }],
        clientDetails: [{ type: Schema.Types.ObjectId, ref: "ClientDetail" }],
        recipientDetails: [
            { type: Schema.Types.ObjectId, ref: "RecipientDetail" },
        ],
        dodoCoins: {
            type: Number,
            default: 0,
            min: 0,
        },
        coinTransactions: [
            {
                type: Schema.Types.ObjectId,
                ref: "CoinTransaction",
                default: [],
            },
        ],
    },
    {
        timestamps: true,
    }
);

const userInterestCategorySchema = new Schema<IUserInterestCategory>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        category: { type: String, required: true },
    },
    {
        timestamps: true,
    }
);

const dodoPageSchema = new Schema<IDodoPage>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        name: { type: String, required: true },
        url: { type: String, required: true, unique: true },
        profilePicture: String,
        socialLinks: {
            type: Map,
            of: String,
            default: {},
        },
        thoughts: String,
        audioBio: String,
        blocks: [{ type: Schema.Types.ObjectId, ref: "Block" }],
    },
    {
        timestamps: true,
    }
);

export { userSchema, userInterestCategorySchema, dodoPageSchema };
