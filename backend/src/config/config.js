require('dotenv').config();

const config = Object.freeze({
    port: process.env.PORT || 3000,
    databaseURI: process.env.DATABASE_URI,
    nodeEnv : process.env.NODE_ENV || "development",
    accessTokenSecret: process.env.JWT_SECRET,
    accessTokenExpiry: process.env.JWT_EXPIRES_IN || '8h',
    clientUrl: process.env.CLIENT_URL,
});

module.exports = config;