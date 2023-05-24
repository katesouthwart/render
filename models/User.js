const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");
const findOrCreate = require("mongoose-findorcreate");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    min: 3,
    max: 30,
    // unique: true
  },
  email: {
    type: String,
    // required: true,
    max: 50,
    unique: true
  },
  googleId: {
    type: String,
  },
  // password: {
  //   type: String,
  //   required: true,
  //   min: 6
  // },
  profilePicture: {
    type: String,
    default: ""
  },
  coverPicture: {
    type: String,
    default: ""
  },
  followers: {
    type: Array,
    default: []
  },
  following: {
    type: Array,
    default: []
  },
  requestedTo: {
    type: Array,
    default: []
  },
  requestedBy: {
    type: Array,
    default: []
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  desc: {
    type: String,
    max: 100
  },
  city: {
    type: String,
    max: 50
  },
  relationship: {
    type: Number,
    enum: [1, 2, 3],
  },
},
{timestamps: true}
);

// userSchema.plugin(passportLocalMongoose);
userSchema.plugin(passportLocalMongoose, { usernameField : 'email' });

userSchema.plugin(findOrCreate);

module.exports = mongoose.model("User", userSchema);
