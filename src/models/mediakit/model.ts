import { model } from "mongoose";
import { IMediaKit } from "../../types/mediakit";
import { MediaKitSchema } from "./schema";

const MediaKitModel = model<IMediaKit>("MediaKit", MediaKitSchema);

export { MediaKitModel };
