const mongoose = require('mongoose');

const contractSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    index: true
  },
  address: {
    type: String,
    required: true,
    validate: {
      validator: v => /^0x[a-fA-F0-9]{40}$/.test(v),
      message: props => `${props.value} is not a valid Ethereum address!`
    }
  },
  chain: {
    type: String,
    required: true,
    enum: ['ethereum/mainnet', 'ethereum/goerli', 'polygon/mainnet', 'bsc/mainnet'],
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
contractSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Contract = mongoose.model('Contract', contractSchema);

module.exports = Contract;