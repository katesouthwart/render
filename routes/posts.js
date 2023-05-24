const router = require("express").Router();
const Post = require("../models/Post");
const User = require("../models/User");

//Create a post
router.post("/", async (req, res) => {
  const newPost = new Post(req.body);

  try{
    const savedPost = await newPost.save();
    return res.status(200).json(savedPost);
  } catch (err){
    return res.status(500).json(err);
  }

});

//Update a post
router.put("/:id", async (req, res) => {

  try {
    const post = await Post.findById(req.params.id);
    if(post.userId === req.user.id) {
      await post.updateOne({ $set: req.body });
      return res.status(200).json("Post successfully updated.");
    } else {
      return res.status(403).json("You can only edit your own posts.")
    }
  } catch (err){
    return res.status(500).json(err);
  }

});

//Delete a post
router.delete("/:id", async (req, res) => {

  try {
    const post = await Post.findById(req.params.id);
    if(post.userId === req.user.id) {
      await post.deleteOne();
      return res.status(200).json("Post successfully deleted.");
    } else {
      return res.status(403).json("You can only delete your own posts.")
    }
  } catch (err){
    return res.status(500).json(err);
  }

});

//Like / un-like a post
router.put("/:id/like", async (req, res) => {
  try{
    const post = await Post.findById(req.params.id);
    if(!post.likes.includes(req.user.id)) {
      await post.updateOne({ $push: { likes: req.user.id } });
      return res.status(200).json("The post has been liked.");
    } else {
      await post.updateOne({ $pull: { likes: req.user.id } });
      return res.status(200).json("The post has been un-liked.");
    }
  } catch (err) {
    return res.status(500).json(err);
  }

});

//Get a post
router.get("/:id", async (req, res) => {

  try {
    const post = await Post.findById(req.params.id);
    return res.status(200).json(post);
  } catch (err) {
    return res.status(500).json(err);
  }

});

//Get all following / timeline postSchema

router.get("/timeline/all", async (req, res) => {

  try {
    const currentUser = await User.findById(req.user.id);
    const currentUserPosts = await Post.find({ userId: user.id });
    const friendPosts = await Promise.all(
      currentUser.following.map((friendId) => {
        return Post.find({ userId: friendId });
      })
    );
    res.json(currentUserPosts.concat(...friendPosts))
    res.render("timeline");
  } catch (err) {
    return res.status(500).json(err);
  }

});

module.exports = router;
