import axios from "axios";
import fs from "fs";
// [
//     {
//         "User id*": "aakash.io",
//         "Media count*": 35,
//         "Followers*": "51k",
//         "Avg. likes*": "7K",
//         "Avg. comments*": 468
//     },
//     {
//         "User id*": "ksatyarth2",
//         "Media count*": 222,
//         "Followers*": "1148",
//         "Avg. likes*": "350",
//         "Avg. comments*": 5
//     },
//     {
//         "User id*": "_keshav_malik",
//         "Media count*": 2,
//         "Followers*": "513",
//         "Avg. likes*": "200",
//         "Avg. comments*": 12
//     },
//     {
//         "User id*": "rajveer.io",
//         "Media count*": 574,
//         "Followers*": "57K",
//         "Avg. likes*": "1K",
//         "Avg. comments*": 355
//     }
// ]

// Function to convert values with "K" suffix to numbers
function parseValue(value: string | number): number {
    if (typeof value === "number") {
        return value;
    }

    const stringValue = value.toString().toLowerCase();
    if (stringValue.includes("k")) {
        const numericValue = parseFloat(stringValue.replace("k", ""));
        return numericValue * 1000;
    }

    return parseInt(stringValue) || 0;
}

async function createBulkMediaKit() {
    const data = fs.readFileSync("./src/script/creator-data.json", "utf8");
    const mediaKit = JSON.parse(data);

    for (const item of mediaKit) {
        const processedData = {
            instaId: item["User id*"],
            followers: parseValue(item["Followers*"]),
            avgLikes: parseValue(item["Avg. likes*"]),
            avgComments: parseValue(item["Avg. comments*"]),
            mediaCount: parseValue(item["Media count*"]),
        };

        console.log("Processing:", processedData);

        try {
            const response = await axios.post(
                "https://api.dodoclub.in/api/v1/mediakit/create",
                processedData
            );
            console.log("Success:", response.data);
        } catch (error: any) {
            console.error(
                "Error for",
                processedData.instaId,
                ":",
                error.response?.data || error.message
            );
        }
    }
}

createBulkMediaKit();
