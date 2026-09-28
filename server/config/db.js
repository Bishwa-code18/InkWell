// config/db.js — MongoDB connection using Mongoose
const dns = require('dns');
const mongoose = require('mongoose');

// Force Google DNS to bypass ISP routers that block SRV record lookups
// (Required for mongodb+srv:// on some Indian ISP networks like Reliance)
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      family: 4, // Force IPv4 — fixes SRV DNS resolution failures on Render/cloud hosts
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Error: ${error.message}`);
    process.exit(1);
  }
};

// Mongoose event listeners for reconnect resilience
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected.');
});

module.exports = connectDB;
