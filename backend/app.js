const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const authRoutes = require('./src/routes/authRoutes');
const { notFound, errorHandler } = require('./src/middleware/errorHandler');
const config = require('./src/config/config');
const app = express();

// Middlewares
app.use(helmet());
app.use(cors({ origin: config.clientUrl, credentials: true }));

app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

// Root endpoint
app.get('/', (req, res) => {
  res.json({message : "Hello"});
})

// Other endpoints
app.use('/api/auth', authRoutes);

// Error Handler
app.use(notFound);
app.use(errorHandler);

module.exports = app;