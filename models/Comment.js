const mongoose = require("mongoose");
const User = require("./User");
const Post = require("./Post");

const commentSchema = new mongoose.Schema({

  parentPost: {
    type: mongoose.Types.ObjectId,
    ref: "Post"
  },
  author: {
    type: mongoose.Types.ObjectId,
    ref: "User"
  },
  text: {
    type: String,
    required: true
  },
  likes: {
    type: Array,
    default: []
  },
},
{timestamps: true}
);

const commentModel = module.exports = mongoose.model("Comment", commentSchema);
