import schedule from "node-schedule";
import axios from "axios";

export const servicePinger = () => {
    schedule.scheduleJob("*/13 * * * *", async () => {
        try {
            const res = await axios.get(
                "https://v-stream-backend.onrender.com/api/v1/healthcheck/health"
            );
            if (res.status === 200) {
                console.log("🔁 Ping successful");
            } else {
                console.log(`⚠️ Ping responded with status: ${res.status}`);
            }
        } catch (err) {
            console.error("❌ Ping failed:", err.message);
        }
    });
};
