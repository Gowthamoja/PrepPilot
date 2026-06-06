const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, "Username is required to create a user"],
        unique: [true, "username already taken"]
    },
    email: {
        type: String,
        required: [true, 'Email is required to create a user'],
        unique: [true, "Account already exists with this email address"]
    },
    password: {
        type: String,
        required: [true, 'Password is required to create a user']
    }
});

const userModel = mongoose.model("user", userSchema);

module.exports = userModel;