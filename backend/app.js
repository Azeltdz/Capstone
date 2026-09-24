const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// Error Handler
app.use(notFound);
app.use(errorHandler);

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true })); // Vercel frontend URL
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

app.get('/', (req, res) => {
  res.json({message : "Hello"});
})

module.exports = app;