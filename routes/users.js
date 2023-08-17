const User = require("../models/User");
const router = require("express").Router();
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const Discover = require("../models/Discover");
const { formatTimestamp } = require('../public/js/helpers');
const { formatJoinedDate } = require('../public/js/helpers');
const fs = require("fs");
const path = require("path");
const _ = require("lodash");

//update user
router.get("/:id/settings", async (req, res) =>{
  if (req.user && req.user.id === req.params.id || req.user && req.user.isAdmin) {
    try {
      if (req.user) {
        const currentUserId = req.user.id;
        const userId = req.params.id;

        if (currentUserId == userId) {
          const user = await User.findById(currentUserId);

          res.render("user_settings", {
            title: "User Settings",
            user
          });

        } else {
          res.redirect("/posts/timeline/all");
        }
      }  else {
        res.redirect("/auth/login");
      }
    } catch (err) {
      res.status(500).json("You can only edit your own profile.")
    }
  } else {
    res.redirect("/auth/login");
  }
});

router.post("/:id/settings", async (req, res) => {
  if (req.user && req.user.id === req.params.id || req.user.isAdmin) {
    if (req.body.isPrivate) {
      req.body.isPrivate = true;
    } else {
      req.body.isPrivate = false;
    }

    try {
      const currentUser = await User.findByIdAndUpdate(req.user.id, {
        $set: req.body,
        usernameLower: _.toLower(req.body.username)
      });
      return res.redirect("/users/" + req.user.id + "/settings");
    } catch (err) {
      return res.status(500).json(err);
    }

  } else {
    return res.status(403).json("You can only update your own account!");
  }
});

//edit header picture
router.post("/:id/settings/header", async (req, res) => {
  if (req.user && req.user.id === req.params.id || req.user.isAdmin) {
  try {
    //Image upload
    let imageUploadFile;
    let uploadPath;
    let newImageName;
    const currentImageName = req.user.headerPicture;

    if (!req.files || Object.keys(req.files).length === 0) {
      console.log("No files uploaded");
    } else {
      imageUploadFile = req.files.img;
      newImageName = Date.now() + imageUploadFile.name + req.user.id;

      uploadPath = path.resolve("./") + "/public/uploads/" + newImageName;

      imageUploadFile.mv(uploadPath, function(err) {
        if (err) return res.status(500).send(err);
      });
    }

    const updateImg = await User.findByIdAndUpdate(req.user.id, {
      headerPicture: newImageName,
    });

    const savedImg = await updateImg.save();

    if (currentImageName !== "flame header.png" && currentImageName !== newImageName) {
      const oldImagePath = path.resolve("./") + "/public/uploads/" + currentImageName;
      try {
        await fs.unlinkSync(oldImagePath);
        console.log("Old image deleted:", oldImagePath);
      } catch (err) {
        console.error("Error deleting old image:", err);
      }
    }

    const redirectUrl = "/users/" + req.user.id + "/settings";
    res.redirect(redirectUrl);

  } catch (err) {
    res.status(500).json(err);
  }
} else {
  res.status(500).json("You can only update your own profile!");
}
});

//edit profile picture
router.post("/:id/settings/profilepic", async (req, res) => {
  if (req.user && req.user.id === req.params.id || req.user.isAdmin) {
  try {
    //Image upload
    let imageUploadFile;
    let uploadPath;
    let newImageName;
    const currentImageName = req.user.profilePicture;

    if (!req.files || Object.keys(req.files).length === 0) {
      console.log("No files uploaded");
    } else {
      imageUploadFile = req.files.img;
      newImageName = Date.now() + imageUploadFile.name + req.user.id;

      uploadPath = path.resolve("./") + "/public/uploads/" + newImageName;

      imageUploadFile.mv(uploadPath, function(err) {
        if (err) return res.status(500).send(err);
      });
    }

    const updateImg = await User.findByIdAndUpdate(req.user.id, {
      profilePicture: newImageName,
    });

    const savedImg = await updateImg.save();

    if (currentImageName !== "flame.PNG" && currentImageName !== newImageName) {
      const oldImagePath = path.resolve("./") + "/public/uploads/" + currentImageName;
      try {
        await fs.unlinkSync(oldImagePath);
        console.log("Old image deleted:", oldImagePath);
      } catch (err) {
        console.error("Error deleting old image:", err);
      }
    }

    const redirectUrl = "/users/" + req.user.id + "/settings";
    res.redirect(redirectUrl);

  } catch (err) {
    res.status(500).json(err);
  }
} else {
  res.status(500).json("You can only update your own profile!");
}
});

//delete user
router.delete("/:id/delete", async (req, res) => {
  if (req.user && req.user.id === req.params.id || req.user.isAdmin) {
    try {
      const currentUserId = req.user.id;
      const deletePosts = await Post.deleteMany({ author: currentUserId });
      const deleteComments = await Comment.deleteMany({ author: currentUserId });
      const deleteDiscover = await Discover.deleteOne({ user: currentUserId });
      const deleteUser = await User.findByIdAndDelete(currentUserId);
      res.status(200).json({
        success: true,
        message: "Successfully deleted user and user assets."
      });
    } catch (err) {
      console.log(err);
      return res.status(500).json(err);
    }
  } else {
    return res.status(403).json("You can only delete your own account!");
  }
});

//get a user
router.get("/:username", async (req, res) => {
  try{
    // const viewedUser = await User.findById(req.params.id);
    const viewedUser = await User.findOne({username: req.params.username});
    let currentUser = "";
    let alreadyLiked = [];
    let alreadySaved = [];
    let alreadyFollowed = false;
    let alreadyRequested = false;

    const {password, updatedAt, requestedTo, email, isAdmin, ...other} = viewedUser._doc
    const limitNumber = 20;
    const posts = await Post.find({ author: viewedUser.id }).sort({ _id: -1}).limit(limitNumber);

    for (const post of posts) {
      let comments = await Comment.find({ parentPost: post.id });
      post.commentCount = comments.length;

      post.formattedCreatedAt = formatTimestamp(post.createdAt);
    }

    // Pagination
    const currentPage = parseInt(req.query.page) || 1;
    const pageSize = 10;

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = currentPage * pageSize;
    const paginatedResults = {};
    paginatedResults.results = posts.slice(startIndex, endIndex);

    if (req.user) {
      currentUser = await User.findById(req.user.id);

      // Find all posts that include the user's ID in the likes array
      const alreadyLikedPosts = await Post.find({ "likes.user": req.user.id });

      const likedPostIds = alreadyLikedPosts.map(post => post._id.toString());
      paginatedResults.results.forEach(post => {
        post.alreadyLiked = likedPostIds.includes(post._id.toString());
      });

      const alreadyLiked = paginatedResults.results.map(post => post.alreadyLiked);

      // Find all posts that include the user's ID in the saves array
      const alreadySavedPosts = await Post.find({ "saves.user": req.user.id });

      const savedPostIds = alreadySavedPosts.map(post => post._id.toString());
      paginatedResults.results.forEach(post => {
        post.alreadySaved = savedPostIds.includes(post._id.toString());
      });

      const alreadySaved = paginatedResults.results.map(post => post.alreadySaved);

      if (other.followers && other.followers.includes(currentUser.id)) {
        other.alreadyFollowed = true;
        alreadyFollowed = true;
      } else {
        other.alreadyFollowed = false;
        alreadyFollowed = false;
      }

      if (other.requestedBy && other.requestedBy.includes(currentUser.id)) {
        other.alreadyRequested = true;
        alreadyRequested = true;
      } else {
        other.alreadyRequested = false;
        alreadyRequested = false;
      }
    }

    other.formattedJoinedAt = formatJoinedDate(other.createdAt);


    if (currentUser && currentUser.id === viewedUser.id) {
      res.render("profile", {
        title: "Render - " + viewedUser.username,
        profile: other,
        paginatedResults,
        currentPage,
        alreadyLiked,
        alreadySaved
      });
    } else if (!viewedUser.isPrivate || viewedUser.followers.includes(currentUser.id)) {
      res.render("user", {
        title: "Render - " + viewedUser.username,
        viewedUser: other,
        paginatedResults,
        currentPage,
        alreadyLiked,
        alreadySaved,
        alreadyFollowed,
        alreadyRequested
      });
    } else {
      res.render("protected", {
        title: "Render - " + viewedUser.username,
        viewedUser: other,
        alreadyRequested
      });
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

//follow / unfollow / request to follow a user
router.post("/:id/follow", async (req, res) => {
  if (req.user) {
    if (req.user.id !== req.params.id) {
      try {
        const viewedUser = await User.findById(req.params.id);
        const currentUser = await User.findById(req.user.id);

        if (!viewedUser.isPrivate) {

          if (!viewedUser.followers.includes(req.user.id)) {
              await viewedUser.updateOne({ $push: { followers: currentUser.id } });
              await currentUser.updateOne({ $push: { following: viewedUser.id } });
              res.status(200).json({
                success: true,
                message: "The user has been followed",
                buttonText: "Following",
                classes: "btn-outline-primary",
                removeClasses: "btn-primary"
            });
          } else {
              await viewedUser.updateOne({ $pull: { followers: currentUser.id } });
              await currentUser.updateOne({ $pull: { following: viewedUser.id } });
              res.status(200).json({
                success: true,
                message: "The user has been unfollowed",
                buttonText: "Follow",
                classes: "btn-primary",
                removeClasses: "btn-outline-primary"
            });
          }
        } else {
          if (!viewedUser.followers.includes(req.user.id)) {
            if (!viewedUser.requestedBy.includes(req.user.id)) {
                await viewedUser.updateOne({ $push: { requestedBy: currentUser.id } });
                await currentUser.updateOne({ $push: { requestedTo: viewedUser.id } });
                res.status(200).json({
                  success: true,
                  message: "The user has been requested to follow",
                  buttonText: "Requested",
                  classes: "btn-outline-primary",
                  removeClasses: "btn-primary"
              });
            } else {
                await viewedUser.updateOne({ $pull: { requestedBy: currentUser.id } });
                await currentUser.updateOne({ $pull: { requestedTo: viewedUser.id }});
                res.status(200).json({
                  success: true,
                  message: "The request to follow has been removed",
                  buttonText: "Follow",
                  classes: "btn-primary",
                  removeClasses: "btn-outline-primary"
              });
            }
          } else {
            await viewedUser.updateOne({ $pull: { followers: currentUser.id } });
            await currentUser.updateOne({ $pull: { following: viewedUser.id } });
            res.status(200).json({
              success: true,
              message: "The private user has been unfollowed.",
              buttonText: "Follow",
              classes: "btn-primary",
              removeClasses: "btn-outline-primary"
            })
          }
        }
        } catch (err) {
          res.status(500).json(err);
        }
    } else {
      res.status(403).json("You can't follow yourself.")
    }

  } else {
    res.status(200).json({
      message: "Users must be logged in to rate posts.",
      authed: false
    });
  }
});


//view follower requests
router.get("/:id/requests", async (req, res) => {
    try {
      if (req.user && req.user.id === req.params.id) {
      const currentUserId = req.user.id;
      let foundUsers = []
      foundUsers = await User.find({ requestedTo: req.params.id});

      // Pagination
      const currentPage = parseInt(req.query.page) || 1;
      const pageSize = 10;

      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = currentPage * pageSize;
      const paginatedResults = {};
      paginatedResults.results = foundUsers.slice(startIndex, endIndex);

        res.render("requests", {
          title: "Render - Follower Requests",
          requestedUsers: foundUsers,
          paginatedResults,
          currentPage,
          currentUserId
        });
    } else {
      return res.status(403).json("You can only access requests for your own account!");
    }
  } catch (err) {
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
  if (req.user) {
    const currentUser = req.user;
    const pageHeading = "Liked Posts";

    if (currentUser && currentUser.id === req.params.id) {
      const followedUsers = await User.find({ followers: currentUser.id, isPrivate: true, });
      const publicUserIds = await User.find({ isPrivate: false }).distinct("_id");

      try {

        const publicLikedPosts = await Post.find({ "likes.user": currentUser.id, author: { $in: publicUserIds } }).populate("author");

        const viewablePrivateLikedPosts = await Post.find({ "likes.user": currentUser.id, author: { $in: followedUsers } }).populate("author");

        const ownLikedPosts = await Post.find({ "likes.user": currentUser.id, author: req.user.id }).populate("author");

        let allPosts = [...publicLikedPosts, ...viewablePrivateLikedPosts, ...ownLikedPosts.flat()];

        for (const post of allPosts) {
          let comments = await Comment.find({ parentPost: post.id });
          post.commentCount = comments.length;
          post.formattedCreatedAt = formatTimestamp(post.createdAt);
        }

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

        // Find all posts that include the user's ID in the likes array
        const alreadyLikedPosts = await Post.find({ "likes.user": req.user.id });

        const likedPostIds = alreadyLikedPosts.map(post => post._id.toString());
        paginatedResults.results.forEach(post => {
          post.alreadyLiked = likedPostIds.includes(post._id.toString());
        });

        const alreadyLiked = paginatedResults.results.map(post => post.alreadyLiked);

        // Find all posts that include the user's ID in the saves array
        const alreadySavedPosts = await Post.find({ "saves.user": req.user.id });

        const savedPostIds = alreadySavedPosts.map(post => post._id.toString());
        paginatedResults.results.forEach(post => {
          post.alreadySaved = savedPostIds.includes(post._id.toString());
        });

        const alreadySaved = paginatedResults.results.map(post => post.alreadySaved);

        res.render("likes_saves", {
          title: "Render - Liked Recipes",
          paginatedResults,
          currentPage,
          currentUser,
          alreadyLiked,
          alreadySaved,
          pageHeading
        });
      } catch (err) {
        res.status(500).json(err);
      }

    } else {
      res.status(403).json("You can only view your own liked posts.");
    }
  } else {
    res.redirect("/auth/login");
  }
});

//view user saved posts
router.get("/:id/saved", async (req, res) => {
  if (req.user) {
    const currentUser = req.user;
    const pageHeading = "Saved Posts";

    if (currentUser && currentUser.id === req.params.id) {
      const followedUsers = await User.find({ followers: currentUser.id, isPrivate: true, });
      const publicUserIds = await User.find({ isPrivate: false }).distinct("_id");

      try {

        const publicSavedPosts = await Post.find({ "saves.user": currentUser.id, author: { $in: publicUserIds } }).populate("author");

        const viewablePrivateSavedPosts = await Post.find({ "saves.user": currentUser.id, author: { $in: followedUsers } }).populate("author");

        const ownSavedPosts = await Post.find({ "saves.user": currentUser.id, author: req.user.id }).populate("author");

        let allPosts = [...publicSavedPosts, ...viewablePrivateSavedPosts, ...ownSavedPosts.flat()];

        for (const post of allPosts) {
          let comments = await Comment.find({ parentPost: post.id });
          post.commentCount = comments.length;
          post.formattedCreatedAt = formatTimestamp(post.createdAt);
        }

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

        // Find all posts that include the user's ID in the likes array
        const alreadyLikedPosts = await Post.find({ "likes.user": req.user.id });

        const likedPostIds = alreadyLikedPosts.map(post => post._id.toString());
        paginatedResults.results.forEach(post => {
          post.alreadyLiked = likedPostIds.includes(post._id.toString());
        });

        const alreadyLiked = paginatedResults.results.map(post => post.alreadyLiked);

        // Find all posts that include the user's ID in the saves array
        const alreadySavedPosts = await Post.find({ "saves.user": req.user.id });

        const savedPostIds = alreadySavedPosts.map(post => post._id.toString());
        paginatedResults.results.forEach(post => {
          post.alreadySaved = savedPostIds.includes(post._id.toString());
        });

        const alreadySaved = paginatedResults.results.map(post => post.alreadySaved);

        res.render("likes_saves", {
          title: "Render - Saved Recipes",
          paginatedResults,
          currentPage,
          currentUser,
          alreadyLiked,
          alreadySaved,
          pageHeading
        });
      } catch (err) {
        res.status(500).json(err);
      }
    } else {
      res.status(403).json("You can only view your own saved posts.");
    }

  } else {
    res.redirect("/auth/login");
  }
});

//View user following
router.get("/:username/following", async (req, res) => {
  if (req.user) {
    const currentUser = req.user;
    const viewedUser = await User.findOne({ username: req.params.username });
    const pageHeading = viewedUser.username + "'s Following";
    let accounts = [];
    let alreadyFollowed = false;
    let alreadyRequested = false;

    if (currentUser && currentUser.id === viewedUser.id || !viewedUser.isPrivate || viewedUser.followers.includes(currentUser.id)) {

      try {
        accounts = await User.find({followers: viewedUser.id})

        for (const account of accounts) {
          if (account.followers && account.followers.includes(currentUser.id)) {
            account.alreadyFollowed = true;
            alreadyFollowed = true;
          } else {
            account.alreadyFollowed = false;
            alreadyFollowed = false;
          }

          if (account.requestedBy && account.requestedBy.includes(currentUser.id)) {
            account.alreadyRequested = true;
            alreadyRequested = true;
          } else {
            account.alreadyRequested = false;
            alreadyRequested = false;
          }
        }

        // Pagination
        const currentPage = parseInt(req.query.page) || 1;
        const pageSize = 10;

        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = currentPage * pageSize;
        const paginatedResults = {};
        paginatedResults.results = accounts.slice(startIndex, endIndex);

        res.render("followers_following", {
          title: "Render - " + viewedUser.username + "'s' Following",
          viewedUser,
          accounts,
          pageHeading,
          paginatedResults,
          currentPage,
          currentUser
        })

      } catch (err) {
        console.log(err);
        res.status(500).json("Unable to view page")
      }

    }
  } else {
    res.redirect("/auth/login");
  }
});

//View user followers
router.get("/:username/followers", async (req, res) => {
  if (req.user) {
    const currentUser = req.user;
    const viewedUser = await User.findOne({ username: req.params.username });
    const pageHeading = viewedUser.username + "'s Followers";
    let accounts = [];
    let alreadyFollowed = false;
    let alreadyRequested = false;

    if (currentUser && currentUser.id === viewedUser.id || !viewedUser.isPrivate || viewedUser.followers.includes(currentUser.id)) {

      try {
        accounts = await User.find({following: viewedUser.id})

        for (const account of accounts) {
          if (account.followers && account.followers.includes(currentUser.id)) {
            account.alreadyFollowed = true;
            alreadyFollowed = true;
          } else {
            account.alreadyFollowed = false;
            alreadyFollowed = false;
          }

          if (account.requestedBy && account.requestedBy.includes(currentUser.id)) {
            account.alreadyRequested = true;
            alreadyRequested = true;
          } else {
            account.alreadyRequested = false;
            alreadyRequested = false;
          }
        }

        // Pagination
        const currentPage = parseInt(req.query.page) || 1;
        const pageSize = 10;

        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = currentPage * pageSize;
        const paginatedResults = {};
        paginatedResults.results = accounts.slice(startIndex, endIndex);

        res.render("followers_following", {
          title: "Render - " + viewedUser.username + "'s' Followers",
          viewedUser,
          accounts,
          pageHeading,
          paginatedResults,
          currentPage,
          currentUser
        })

      } catch (err) {
        console.log(err);
        res.status(500).json("Unable to view page")
      }
    }
  } else {
    res.redirect("/auth/login");
  }
});

module.exports = router
