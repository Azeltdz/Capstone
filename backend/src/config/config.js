require('dotenv').config();

const config = Object.freeze({
    port: process.env.PORT || 3000,
    databaseURI: process.env.DATABASE_URI,
    nodeEnv : process.env.NODE_ENV || "development",
    accessTokenSecret: process.env.JWT_SECRET,
    accessTokenExpiry: process.env.JWT_EXPIRES_IN || '8h',
    clientUrl: process.env.CLIENT_URL,
    supabaseUrl: process.env.SUPABASE_URL, 
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY, 
    supabaseBucket: process.env.SUPABASE_BUCKET || 'menu-images'
});

module.exports = config;