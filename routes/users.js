const User = require("../models/User");
const router = require("express").Router();
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const Post = require("../models/Post");

//update user
router.get("/:id/settings", (req, res) =>{
  res.render("user_settings", { title: "Settings" } );
})

router.put("/:id/settings", async (req, res) => {
  if (req.user && req.user.id === req.params.id || req.user.isAdmin) {

    if (req.body.password) {
      const currentUser = await User.findById(req.user.id);

      try {
        await currentUser.setPassword(req.body.password);
        await currentUser.save();
      } catch (err) {
        return res.status(422).json(err);
      }

    }

    if (req.body.isPrivate) {
      req.body.isPrivate = true;
    } else {
      req.body.isPrivate = false;
    }

    try {
      const currentUser = await User.findByIdAndUpdate(req.user.id, {
        $set: req.body,
      });
      return res.status(200).json("Account has been updated.");
    } catch (err) {
      return res.status(500).json(err);
    }

  } else {
    return res.status(403).json("You can only update your own account!");
  }
});

//delete user
router.delete("/:id", async (req, res) => {
  if (req.user && req.user.id === req.params.id || req.user.isAdmin) {

    try {
      const currentUser = await User.findByIdAndDelete(req.user.id);
      res.redirect("/");
    } catch (err) {
      return res.status(500).json(err);
    }

  } else {
    return res.status(403).json("You can only delete your own account!");
  }
});

//get a user
router.get("/:id", async (req, res) => {

  try{
    const viewedUser = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);
    const {password, updatedAt, requestedTo, requestedBy, email, isAdmin, ...other} = viewedUser._doc
    const limitNumber = 20;
    const posts = await Post.find({ author: req.params.id}).sort({ _id: -1}).limit(limitNumber);


    // Pagination
    const currentPage = parseInt(req.query.page) || 1;
    const pageSize = 10;

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = currentPage * pageSize;
    const paginatedResults = {};
    paginatedResults.results = posts.slice(startIndex, endIndex);

    if (currentUser && currentUser.id === viewedUser.id) {
      res.render("profile", {
        title: viewedUser.username,
        profile: other,
        paginatedResults,
        currentPage
      });
    } else if (!viewedUser.isPrivate || viewedUser.followers.includes(currentUser.id)) {
      res.render("user", {
        title: viewedUser.username,
        viewedUser: other,
        paginatedResults,
        currentPage
      });
    } else {
      res.render("protected", {viewedUser: other});
    }


  } catch (err) {
    res.status(500).json(err);
  }

});

//follow / unfollow / request to follow a user
router.post("/:id/follow", async (req, res) => {

  if (req.user && req.user.id !== req.params.id) {

    try {
      const viewedUser = await User.findById(req.params.id);
      const currentUser = await User.findById(req.user.id);

      if (!viewedUser.isPrivate) {

        if (!viewedUser.followers.includes(req.user.id)) {

          try {
            await viewedUser.updateOne({ $push: { followers: currentUser.id } });
            await currentUser.updateOne({ $push: { following: viewedUser.id } });
            // res.status(200).
            res.redirect("/users/" + req.params.id);
          } catch (err){
            res.status(500).json(err);
          }

        } else {

          try {
            await viewedUser.updateOne({ $pull: { followers: currentUser.id } });
            await currentUser.updateOne({ $pull: { following: viewedUser.id } });
            res.redirect("/users/" + req.params.id);
          } catch (err){
            res.status(500).json(err);
          }

        }

      } else {

        if (!viewedUser.followers.includes(req.user.id)) {

          if (!viewedUser.requestedBy.includes(req.user.id)) {

            try {
              await viewedUser.updateOne({ $push: { requestedBy: currentUser.id } });
              await currentUser.updateOne({ $push: { requestedTo: viewedUser.id } });
            res.redirect("/users/" + req.params.id);
            }catch (err){
              res.status(500).json(err);
            }

          } else {

            try {
              await viewedUser.updateOne({ $pull: { requestedBy: currentUser.id } });
              await currentUser.updateOne({ $pull: { requestedTo: viewedUser.id }});
              res.redirect("/users/" + req.params.id);
            }catch (err){
              res.status(500).json(err);
            }

          }

        }

      }

      } catch (err) {
          return res.status(500).json(err);
      }

  } else {
  return res.status(403).json("You can't follow yourself.")
  }

});


//view follower requests

router.get("/:id/requests", async (req, res) => {

    try {
      if (req.user && req.user.id === req.params.id) {
      const currentUser = req.user.id;
      const foundUsers = await User.find({ requestedTo: req.params.id});

      // Pagination
      const currentPage = parseInt(req.query.page) || 1;
      const pageSize = 10;

      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = currentPage * pageSize;
      const paginatedResults = {};
      paginatedResults.results = foundUsers.slice(startIndex, endIndex);


      if (foundUsers.length > 0) {
        res.render("requests", {
          title: "Render - Follower Requests",
          requestedUsers: foundUsers,
          paginatedResults,
          currentPage,
          currentUser
        });
      } else {
        res.render("requests", {
          title: "Render - Follower Requests",
        });
      }
    } else {
      return res.status(403).json("You can only access requests for your own account!");
    }
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }

});

//accept follow requests from a user
router.post("/:id/requests/accept", async (req, res) => {

  if (req.user && req.user.id === req.params.id) {

    const requestedUser = await User.findById(req.body.requesterId);
    const currentUser = await User.findById(req.user.id);

    try{

      await currentUser.updateOne({ $push: {followers: requestedUser.id } });
      await requestedUser.updateOne({ $push: { following: currentUser.id } });
      await currentUser.updateOne({ $pull: { requestedBy: requestedUser.id } });
      await requestedUser.updateOne({ $pull: { requestedTo: currentUser.id } });
      res.redirect("/users/" + req.user.id + "/requests");


    } catch (err) {
      res.status(500).json(err);
    }

  } else {
    return res.status(403).json("You can only access requests for your own account!");
  }


});

//decline follow requests from a user
router.post("/:id/requests/decline", async (req, res) => {

  if (req.user && req.user.id === req.params.id) {

    const requestedUser = await User.findById(req.body.requesterId);
    const currentUser = await User.findById(req.user.id);

    try{

      await currentUser.updateOne({ $pull: { requestedBy: requestedUser.id } });
      await requestedUser.updateOne({ $pull: { requestedTo: currentUser.id } });
      res.redirect("/users/" + req.user.id + "/requests");

    } catch (err) {
      res.status(500).json(err);
    }

  } else {
    return res.status(403).json("You can only access requests for your own account!");
  }

});

//view user liked posts
router.get("/:id/likes", async (req, res) => {

  const currentUser = req.user;

  if (currentUser && currentUser.id === req.params.id) {
    const followedUsers = await User.find({ followers: currentUser.id })

    try {

      const publicLikedPosts = await Post.find({ "likes.user": currentUser.id, "author.isPrivate": false }).populate("author");
      const viewablePrivateLikedPosts = await Post.find({ "likes.user": currentUser.id, "author.isPrivate": true, author: { $in: followedUsers } }).populate("author");

      let allPosts = [...publicLikedPosts, ...viewablePrivateLikedPosts.flat()];
      // allPosts = allPosts.sort((a, b) => b.createdAt - a.createdAt);
      allPosts.sort((a, b) => {
        const lastLikedA = a.likes.find((like) => like.user.toString() === currentUser.id.toString());
        const lastLikedB = b.likes.find((like) => like.user.toString() === currentUser.id.toString());

        if (lastLikedA && lastLikedB) {
          return lastLikedB.likedAt - lastLikedA.likedAt;
        } else if (lastLikedA) {
          return -1;
        } else if (lastLikedB) {
          return 1;
        }

        return b.createdAt - a.createdAt; // Fallback to sorting by creation time if no likes from the current user
      });

      // Pagination
      const currentPage = parseInt(req.query.page) || 1;
      const pageSize = 10;

      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = currentPage * pageSize;
      const paginatedResults = {};
      paginatedResults.results = allPosts.slice(startIndex, endIndex);

      res.render("timeline", {
        title: "Render - Likes",
        paginatedResults,
        currentPage,
        currentUser
      });
    } catch (err) {
      res.status(500).json(err);
    }

  } else {
    res.status(403).json("You can only view your own liked posts.");
  }

});

//view user saved posts
router.get("/:id/saved", async (req, res) => {

  const currentUser = req.user;

  if (currentUser && currentUser.id === req.params.id) {
    const followedUsers = await User.find({ followers: currentUser.id })

    try {

      const publicSavedPosts = await Post.find({ "saves.user": currentUser.id, "author.isPrivate": false }).populate("author");
      const viewablePrivateSavedPosts = await Post.find({ "saves.user": currentUser.id, "author.isPrivate": true, author: { $in: followedUsers } }).populate("author");

      let allPosts = [...publicSavedPosts, ...viewablePrivateSavedPosts.flat()];
      // allPosts = allPosts.sort((a, b) => b.createdAt - a.createdAt);
      allPosts.sort((a, b) => {
        const lastSavedA = a.saves.find((save) => save.user.toString() === currentUser.id.toString());
        const lastSavedB = b.saves.find((save) => save.user.toString() === currentUser.id.toString());

        if (lastSavedA && lastSavedB) {
          return lastSavedB.savedAt - lastSavedA.savedAt;
        } else if (lastSavedA) {
          return -1;
        } else if (lastSavedB) {
          return 1;
        }

        return b.createdAt - a.createdAt; // Fallback to sorting by creation time if no likes from the current user
      });

      // Pagination
      const currentPage = parseInt(req.query.page) || 1;
      const pageSize = 10;

      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = currentPage * pageSize;
      const paginatedResults = {};
      paginatedResults.results = allPosts.slice(startIndex, endIndex);

      res.render("timeline", {
        title: "Render - Saved Recipes",
        paginatedResults,
        currentPage,
        currentUser
      });
    } catch (err) {
      res.status(500).json(err);
    }

  } else {
    res.status(403).json("You can only view your own liked posts.");
  }

});


module.exports = router
