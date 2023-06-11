const mongoose = require("mongoose");
const User = require("./User");

const postSchema = new mongoose.Schema({

  // userId: {
  //   type: String,
  //   required: true
  // },
  title: {
    type: String,
    required: true,
    max: 100
  },
  desc: {
    type: String,
    required: true,
    max: 500
  },
  img: {
    type: String,
    required: true
  },
  ingredients: {
    type: Array,
    default: [],
    required: true
  },
  instructions: {
    type: Array,
    default: [],
    required: true
  },
  likes: {
    type: Array,
    default: []
  },
  category: {
    type: String,
    enum: ['American', 'Mexican', 'Italian', 'Chinese', 'Mediterranean', 'Indian', 'Dessert', 'Cocktail', 'British', 'French'],
    required: true
  },
  servings: {
    type: Number,
    required: true,
    min: 1
  },
  prepHours: {
    type: Number,
    min: 0
  },
  prepMins: {
    type: Number,
    required: true,
    min: 0,
    max: 59
  },
  cookHours: {
    type: Number,
    min: 0
  },
  cookMins: {
    type: Number,
    required: true,
    min: 0,
    max: 59
  },
  totalMins:{
    type: Number,
  },
  author:{
    type: mongoose.Types.ObjectId,
    ref: "User"
  },

},
{timestamps: true}
);

postSchema.index({ title: "text", desc: "text", ingredients: "text", category: "text" });


const postModel = module.exports = mongoose.model("Post", postSchema);
