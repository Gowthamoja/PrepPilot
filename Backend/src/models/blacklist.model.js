const mongoose = require("mongoose");

const blacklistModelSchema = new mongoose.Schema({
    token: {
        type: String,
        required: [true, "token is required to be added in blacklist"]
    }
}, {
    timestamps: true
});

const blacklistTokenModel = mongoose.model("blacklistToken", blacklistModelSchema);

module.exports = blacklistTokenModel;