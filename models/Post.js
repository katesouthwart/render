const mongoose = require("mongoose");
const User = require("./User");

const postSchema = new mongoose.Schema({

  title: {
    type: String,
    required: true,
    max: 100
  },
  desc: {
    type: String,
    required: true,
    max: 200
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
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectID,
      ref: "User"},
    likedAt: {
      type: Date,
      default: Date.now
    }
  }],
  saves: [{
    user: {
      type: mongoose.Schema.Types.ObjectID,
      ref: "User"},
    savedAt: {
      type: Date,
      default: Date.now
    }
  }],
  reviews: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectID,
        ref: "User"
      },
      rating: {
        type: Number,
        min: 1,
        max: 5
      }
    }
  ],
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
    type: String
  },
  prepMins: {
    type: String
  },
  cookHours: {
    type: String,
  },
  cookMins: {
    type: String
  },
  totalMins:{
    type: Number,
  },
  displayHours: {
    type: String,
  },
  displayMins: {
    type: String,
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
