require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const { closeDriver } = require('./models/neo4j');
const { checkConnection } = require('./models/neo4j');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const rateLimit = require('express-rate-limit');
const app = express();
const PORT = process.env.PORT || 5000;
app.use(express.json());

// Middleware configuration
app.use(cors({
    origin: ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true 
}));
app.use(bodyParser.json({ limit: '100mb' }));
app.use(cookieParser());
const limiter = rateLimit({
    max :100,
    windowMs : 60*60*100,
    message : 'Too many requests,please try again after an hour!'
})
app.use(limiter);

// Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/products', productRoutes);

checkConnection().then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});


// Graceful shutdown: Close Neo4j driver and server on termination signals
const shutdown = async () => {
    console.log('Shutting down server...');
    try {
        await closeDriver();
        server.close(() => {
            console.log('Server closed successfully');
            process.exit(0);
        });
    } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
    }
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);