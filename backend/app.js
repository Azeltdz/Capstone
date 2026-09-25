const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const authRoutes = require('./src/routes/authRoutes');
const branchRoutes = require('./src/routes/branchRoutes');
const tableRoutes = require('./src/routes/tableRoutes');
const staffRoutes = require('./src/routes/staffRoutes');

const config = require('./src/config/config');
const { notFound, errorHandler } = require('./src/middleware/errorHandler');
const app = express();

// Middlewares
app.use(helmet());
app.use(cors({ origin: config.clientUrl, credentials: true }));

app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

// Root endpoint
app.get('/', (req, res) => {
  res.json({message : "Hello!"});
})

// Other endpoints
app.use('/api/auth', authRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api', tableRoutes);
app.use('/api/staff', staffRoutes);

// Error Handler
app.use(notFound);
app.use(errorHandler);

module.exports = app;