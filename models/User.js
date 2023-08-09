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

  profilePicture: {
    type: String,
    default: "flame.PNG"
  },
  headerPicture: {
    type: String,
    default: "flame header.png"
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
    max: 150
  },
  // city: {
  //   type: String,
  //   max: 50
  // },
  isAuthor: {
    type: Boolean,
    default: false
  },
},
{timestamps: true}
);

// userSchema.plugin(passportLocalMongoose);
userSchema.plugin(passportLocalMongoose, { usernameField : 'email' });

userSchema.plugin(findOrCreate);

const userModel = module.exports = mongoose.model("User", userSchema);
