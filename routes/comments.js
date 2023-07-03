const router = require("express").Router();
const Comment = require("../models/Comment");
const Post = require("../models/Post");
const User = require("../models/User");

//Create a comment
router.post("/create", async (req, res) => {
  try {

    if (req.user) {

      const newComment = new Comment({
        parentPost: req.body.parentPostId,
        author: req.body.commentAuthorId,
        text: req.body.commentText,
      });

      const savedComment = await newComment.save();

      res.status(200).json("Comment successfully added.")
    } else {
      //In future, prompt on page login pop-up
      res.redirect("/auth/login");
    }

  } catch (err) {
    res.status(500).json(err);
  }
});

//Update a comment
router.post("/:id/edit", async (req, res) => {

  try {
    const comment = await Comment.findById(req.params.id);

    if (comment.author.toString() === req.user.id || req.user.isAdmin) {
      await comment.updateOne({ $set: req.body });
      res.status(200).json("Comment successfully updated.");
    } else {
      res.status(403).json("You can only edit your own comments.");
    }
  } catch (err) {
    res.status(500).json(err);
  }

});

//Delete a comment
router.delete("/:id/delete", async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (comment.author.toString() === req.user.id || req.user.isAdmin) {
      await comment.deleteOne();
    } else {
      res.status(403).json("You can only delete your own comments.")
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

//Like / un-like a comment
router.put("/:id/like", async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (req.user) {

      if (!comment.likes.includes(req.user.id)) {
        await comment.updateOne({ $push: { likes: req.user.id } });
        res.status(200).json("The comment has been liked.");
      } else {
        await comment.updateOne({ $pull: { likes: req.user.id } } );
        res.status(200).json("The comment has been un-liked.");
      }
    } else {
      //In future, prompt on page login pop-up
      res.redirect("/auth/login");
    }

  } catch (err) {
    res.status(500).json(err);
  }

});

module.exports = router;
