const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({

  userId: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  desc: {
    type: String,
    required: true,
    max: 500
  },
  img: {
    type: String
  },
  ingredients: {
    type: Array,
    default: []
  },
  instructions: {
    type: Array,
    default: []
  },
  likes: {
    type: Array,
    default: []
  }

},
{timestamps: true}
);

module.exports = mongoose.model("Post", postSchema);
