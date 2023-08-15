const mongoose = require("mongoose");
const User = require("./User");

const discoverSchema = new mongoose.Schema({
  user: {
    type: mongoose.Types.ObjectId,
    ref: "User"
  },
  img1: {
    type: String,
  },
  img2: {
    type: String,
  },
  img3: {
    type: String,
  },
  img4: {
    type: String,
  },
  img5: {
    type: String,
  },
  img6: {
    type: String,
  },
  diet: {
    type: String,
    enum: ['No Limits', 'Vegetarian', 'Vegan', 'Pescatarian', 'Kosher', 'Halal'],
    required: true
  },
  desc: {
    type: String,
    max: 300
  },
},
{timestamps: true}
);

const discoverModel = module.exports = mongoose.model("Discover", discoverSchema);
