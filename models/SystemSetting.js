const mongoose = require('mongoose');

const systemSettingSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    valueString: { type: String },
    valueDate: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('SystemSetting', systemSettingSchema);
