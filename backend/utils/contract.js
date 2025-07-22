const mongoose = require('mongoose');
const Contract = require('../models/Contract'); // Assuming you have a Contract model

async function saveContractAddress(name, address, chain) {
  try {
    // Connect to MongoDB if not already connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
    }

    // Create or update contract record
    const contract = await Contract.findOneAndUpdate(
      { name, chain },
      { address },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log(`Contract ${name} (${chain}) saved with address: ${address}`);
    return contract;
  } catch (error) {
    console.error('Error saving contract address:', error);
    throw error;
  }
}

async function getContractAddress(name, chain) {
  try {
    const contract = await Contract.findOne({ name, chain });
    return contract ? contract.address : null;
  } catch (error) {
    console.error('Error fetching contract address:', error);
    return null;
  }
}

module.exports = {
  saveContractAddress,
  getContractAddress
};