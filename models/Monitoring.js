const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
  url: { type: String, required: true }
}, { _id: false });

const harvestDaySchema = new mongoose.Schema({
  date: { type: Date, required: true },
  notificationStatus: { type: Boolean, default: false }
}, { _id: false });

const monitoringSchema = new mongoose.Schema({
  userID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  plotNo: {
    type: String,
  },
  gourdType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GourdType',
    required: true,
  },
  dateOfPollination: {
    type: Date,
    required: true,
  },
  dateOfHarvest: {
    type: [harvestDaySchema], // Array of 7 days
    required: true,
    validate: [arr => arr.length === 7, 'dateOfHarvest must have 7 days']
  },
  pollinatedFlowerImages: [imageSchema],
  fruitHarvestedImages: [imageSchema],
  status: {
    type: String,
    enum: ['In Progress', 'Completed', 'Failed'],
    default: 'In Progress',
  },
});

monitoringSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

monitoringSchema.set('toJSON', {
  virtuals: true,
});

const Monitoring = mongoose.model('Monitoring', monitoringSchema);

module.exports = Monitoring;