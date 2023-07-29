const router = require("express").Router();
const Post = require("../models/Post");
const User = require("../models/User");
const Comment = require("../models/Comment");
const { formatTimestamp } = require('../public/js/helpers');

//Create a post
router.get("/create", async (req, res) => {
  const infoErrorsObj = req.flash("infoErrors");
  const infoSubmitObj = req.flash("infoSubmit");
  res.render("post_create", {
    title: "Render - Create a Recipe",
    infoErrorsObj,
    infoSubmitObj
  });
});

router.post("/create", async (req, res) => {

  try {

    //Image upload
    let imageUploadFile;
    let uploadPath;
    let newImageName;

    if (!req.files || Object.keys(req.files).length === 0) {
      console.log("No files uplaoded");
    } else {
      imageUploadFile = req.files.img;
      newImageName = Date.now() + imageUploadFile.name;

      uploadPath = require("path").resolve("./") + "/public/uploads/" + newImageName;

      imageUploadFile.mv(uploadPath, function(err) {
        if (err) return res.status(500).send(err);
      });
    }

    //Time
    let prepMins = req.body.prepMins || 0;
      prepMins = prepMins.toString().padStart(2, '0');
    let prepHours = req.body.prepHours || 0;
      prepHours = prepHours.toString().padStart(2, '0');
    let cookMins = req.body.cookMins || 0;
      cookMins = cookMins.toString().padStart(2, '0');
    let cookHours = req.body.cookHours || 0;
      cookHours = cookHours.toString().padStart(2, '0');

    const totalMins = Number(prepHours * 60) + Number(cookHours * 60) + Number(prepMins) + Number(cookMins);

    let displayHours = Number(Math.floor(totalMins / 60));
      displayHours =  displayHours.toString().padStart(2, '0');
    let displayMins = Number(totalMins % 60);
      displayMins =  displayMins.toString().padStart(2, '0');

    //Post Creation
    const newPost = new Post({
      author: req.body.author,
      title: req.body.title,
      desc: req.body.desc,
      img: newImageName,
      // img: "flame header.png",
      ingredients: req.body.ingredients,
      instructions: req.body.instructions,
      category: req.body.category,
      servings: req.body.servings,
      prepHours: prepHours,
      prepMins: prepMins,
      cookHours: cookHours,
      cookMins: cookMins,
      totalMins: totalMins,
      displayHours: displayHours,
      displayMins: displayMins
    });

    const savedPost = await newPost.save();

    const user = await User.findById(req.body.author);

    if (!user.isAuthor) {
      try {
        await User.findByIdAndUpdate(user, {
          $set: {
            isAuthor: true
          }
        });
      } catch (err) {
        res.status(500).json(err);
      }
    }
    res.redirect("/posts/" + savedPost.id);
  } catch (err) {
    req.flash("infoErrors", err);
  }

});

//Update a post
router.post("/:id/edit", async (req, res) => {
  //test functionality
  try {
    const post = await Post.findById(req.params.id);

    if (post.author.toString() === req.user.id || req.user.isAdmin) {
      await post.updateOne({ $set: req.body });
      res.status(200).json("Post successfully updated.");
    } else {
      res.status(403).json("You can only edit your own posts.");
    }
  } catch (err) {
    res.status(500).json(err);
  }

});

router.get("/:id/edit", async (req, res) => {
  res.render("edit_post");
});

//Delete a post
router.delete("/:id/delete", async (req, res) => {
  //test functionality once frontend done
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json("Post not found.");
    }

    if (post.author.toString() === req.user.id || req.user.isAdmin) {
      await post.deleteOne();

      try {
        const otherPosts = await Post.find({ author: req.user.id });
        if (!otherPosts || otherPosts.length === 0) {
          try {
            await User.findByIdAndUpdate(req.user.id, { $set: { isAuthor: false } });
          } catch (err) {
            res.status(500).json(err);
          }
        }

      } catch (err) {
        res.status(500).json(err);
      }

      res.status(200).json("Post successfully deleted.");
    } else {
      res.status(403).json("You can only delete your own posts.")
    }
  } catch (err) {
    res.status(500).json(err);
  }

});

//Like / unlike a post
router.put("/:id/like", async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await Post.findById(postId);

    if (req.user) {
      const userId = req.user.id;

      const alreadyLiked = post.likes.some((like) => like.user.equals(userId));

      if (!alreadyLiked) {

        const likeObject = {
          user: userId,
          likedAt: new Date(),
        };

        post.likes.push(likeObject);
        await post.save();

        res.status(200).json({ message: "The post has been liked.", likes: post.likes.length, alreadyLiked: true });
      } else {

        post.likes = post.likes.filter((like) => !like.user.equals(userId));
        await post.save();


        res.status(200).json({ message: "The post has been un-liked.", likes: post.likes.length, alreadyLiked: false });
      }
    } else {

      res.redirect("/auth/login");
    }
  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
});

//Save / un-save a posts
router.put("/:id/save", async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await Post.findById(postId);

    if (req.user) {
      const userId = req.user.id;

      const alreadySaved = post.saves.some((save) => save.user.equals(userId));

      if (!alreadySaved) {

        const saveObject = {
          user: userId,
          savedAt: new Date(),
        };

        post.saves.push(saveObject);
        await post.save();

        res.status(200).json({ message: "The post has been saved.", saves: post.saves.length, alreadySaved: true });
      } else {

        post.saves = post.saves.filter((save) => !save.user.equals(userId));
        await post.save();


        res.status(200).json({ message: "The post has been un-saved.", saves: post.saves.length, alreadySaved: false });
      }
    } else {

      res.redirect("/auth/login");
    }
  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
});

//Submit rating for a post
router.post("/:id/rate", async (req, res) => {
  try {
    const postId = req.params.id;
    const currentUserId = req.user.id;
    const rating = req.body.rating;

    const post = await Post.findOne({ _id: postId, 'reviews.user': currentUserId});
    if (post) {
      await Post.updateOne(
        { _id: postId, 'reviews.user': currentUserId },
        { $set : { 'reviews.$.rating': rating } }
      );
    } else {
      await Post.findByIdAndUpdate(postId, {
        $push: {reviews: {user: currentUserId, rating: rating } }
      });
    }
    res.status(200).json("Rating submitted successfully.");

  } catch (err) {
    res.status(500).json(err);
  }
});


//Get a post
router.get("/:id", async (req, res) => {

  try {
    let post = await Post.findById(req.params.id).populate("author");
    const author = post.author;
    let currentUser = "";
    const postId = req.params.id;
    let comments = await Comment.find({ parentPost: postId }).populate("author");
    let userReviewScores = {};

    comments.forEach(function(comment, index){
      userReviewScores[comment.author.id] = post.reviews.find((review) => review.user._id.toString() === comment.author.id);

      comment.formattedCreatedAt = formatTimestamp(comment.createdAt);
    });

    let currentUserRating = 0;

    const totalRatings = post.reviews.length;

    let averageRating = 0;
    let roundedAverageRating = 0;
    let averageOneDecimal = 0;

    if (totalRatings > 0) {
      totalRatingSum = post.reviews.reduce((sum, review) => sum + review.rating, 0);
      averageRating = totalRatingSum / totalRatings;
      roundedAverageRating = Math.round(averageRating);
      averageOneDecimal = averageRating.toFixed(1);
    }



    if (req.user) {
      currentUser = await User.findById(req.user.id);
      const currentUserReview = await Post.findOne({ _id: postId, 'reviews.user': currentUser._id });
      if (currentUserReview) {
        currentUserRating = currentUserReview.reviews.find(review => review.user.equals(currentUser._id)).rating;
      }

      post = post.toObject();

      post.formattedCreatedAt = formatTimestamp(post.createdAt);

      if (post.likes && Array.isArray(post.likes)) {
        post.alreadyLiked = post.likes.some(like => like.user.toString() === currentUser.id);
      }

      if (post.saves && Array.isArray(post.saves)) {
        post.alreadySaved = post.saves.some(save => save.user.toString() === currentUser.id);
      }

    }

    if (!author.isPrivate || (req.user && req.user.id === author.id) || (author.followers.includes(currentUser.id)) ) {
      res.render("post", {
        title: "Render - Recipe",
        post,
        author,
        currentUser,
        comments,
        currentUserRating,
        averageRating,
        roundedAverageRating,
        averageOneDecimal,
        userReviewScores
      });
    } else {
        res.render("protected", {
          title: "Render - Recipe",
          viewedUser: author
        })
      }

    } catch (err) {
      console.log(err);
      res.status(500).json(err);
    }
});

//Get all following / timeline postSchema
router.get("/timeline/all", async (req, res) => {

  try {
    const currentUser = await User.findById(req.user.id);
    const currentUserPosts = await Post.find({ author: currentUser.id }).populate("author");
    const friendPosts = await Promise.all(
      currentUser.following.map((friendId) => {
        return Post.find({ author: friendId }).populate("author");
      })
    );

    let allPosts = [...currentUserPosts, ...friendPosts.flat()];
    allPosts = allPosts.sort((a, b) => b.createdAt - a.createdAt);

    for (const post of allPosts) {
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

    res.render("timeline", {
      title: "Render - Timeline",
      paginatedResults,
      currentPage,
      currentUser,
      alreadyLiked,
      alreadySaved
    });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }

});


module.exports = router;
