const mongoose = require('mongoose');
require('dotenv').config();

let isConnected = false; // ✅ Track connection state

exports.connect = async () => {
    if (isConnected) {
        console.log("✅ Using existing database connection");
        return;
    }

    try {
        const db = await mongoose.connect(process.env.DATABASE_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        isConnected = db.connections[0].readyState;
        console.log("✅ DB Connection established!!");
    } catch (error) {
        console.error("❌ DB connection failed:", error.message);
        process.exit(1);  // Stop the process if DB fails to connect
    }
};
