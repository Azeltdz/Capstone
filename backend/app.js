const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const authRoutes = require('./src/routes/authRoutes');
const branchRoutes = require('./src/routes/branchRoutes');
const tableRoutes = require('./src/routes/tableRoutes');
const staffRoutes = require('./src/routes/staffRoutes');

const ingredientRoutes = require('./src/routes/ingredientRoutes');
const menuRoutes = require('./src/routes/menuRoutes');
const bomRoutes = require('./src/routes/bomRoutes');
const inventoryRoutes = require('./src/routes/inventoryRoutes');
const orderRoutes = require('./src/routes/orderRoutes');

const settingsRoutes = require('./src/routes/settingsRoutes');

const config = require('./src/config/config');
const { notFound, errorHandler } = require('./src/middleware/errorHandler');
const app = express();
const path = require('path');

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
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api', tableRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/ingredients', ingredientRoutes);
app.use('/api/menu-items', menuRoutes);
app.use('/api/bom', bomRoutes);
app.use('/api', inventoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api', settingsRoutes);

// Error Handler
app.use(notFound);
app.use(errorHandler);

module.exports = app;