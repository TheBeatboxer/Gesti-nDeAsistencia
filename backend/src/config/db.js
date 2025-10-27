const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Opciones específicas para MongoDB Atlas
        const options = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000, // Timeout después de 5 segundos
            socketTimeoutMS: 45000, // Cierra sockets después de 45 segundos de inactividad
        };

        const conn = await mongoose.connect(process.env.MONGO_URI, options);
        
        // Configurar event listeners para la conexión
        mongoose.connection.on('connected', () => {
            console.log(`MongoDB Connected: ${conn.connection.host}`);
        });

        mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB disconnected');
        });

        // Manejar señales de cierre
        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            process.exit(0);
        });

        return conn;
    } catch (error) {
        console.error(`Error de conexión a MongoDB: ${error.message}`);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
};

module.exports = connectDB;