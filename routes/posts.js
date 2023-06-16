const router = require("express").Router();
const Post = require("../models/Post");
const User = require("../models/User");

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

    if (post.author.toString() === req.user.id) {
      await post.updateOne({
        $set: req.body
      });
      res.status(200).json("Post successfully updated.");
    } else {
      res.status(403).json("You can only edit your own posts.")
    }
  } catch (err) {
    res.status(500).json(err);
  }

});

//Delete a post
router.delete("/:id/delete", async (req, res) => {
  //test functionality once frontend done
  try {
    const post = await Post.findById(req.params.id);

    if (post.author.toString() === req.user.id) {
      await post.deleteOne();

      try {
        const otherPosts = await Post.find({
          author: req.user.id
        });
        if (!otherPosts || otherPosts.length === 0) {
          try {
            await User.findByIdAndUpdate(req.user.id, {
              $set: {
                isAuthor: false
              }
            });
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

//Like / un-like a post
router.put("/:id/like", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (req.user) {

      if (!post.likes.includes(req.user.id)) {
        await post.updateOne({ $push: { likes: req.user.id } });
        res.status(200).json("The post has been liked.");
      } else {
        await post.updateOne({ $pull: { likes: req.user.id } });
        res.status(200).json("The post has been un-liked.");
      }

    } else {
      res.redirect("/auth/login");
    }

  } catch (err) {
    res.status(500).json(err);
  }
});

//Save / un-save a posts
router.put("/:id/save", async (req, res) => {
  //test functionality once frontend
  try {
    const post = await Post.findById(req.params.id);

    if (req.user) {

      if (!post.saves.includes(req.user.id)) {
        await post.updateOne({ $push: { saves: req.user.id } });
        res.status(200).json("The post has been saved.");
      } else {
        await post.updateOne({ $pull: { saves: req.user.id } });
        res.status(200).json("The post has been un-saved");
      }

    } else {
      res.redirect("/auth/login");
    }

  } catch (err) {
    res.status(500).json(err);
  }
})

//Submit rating for a post
router.post("/:id/rate", async (req, res) => {
  //test functionality once frontend
  try {
    const postId = req.params.id;
    const currentUserId = req.user.id;
    const rating = req.body.rating;

    const post = await Post.findOne({ _id: postId, 'reviews.user': userId});
    if (post) {
      await Post.updateOne(
        { _id: postId, 'reviews.user': userId },
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
    const post = await Post.findById(req.params.id).populate("author");
    const author = post.author;
    let currentUser = "";

    if (req.user) {
      currentUser = await User.findById(req.user.id);
    }

    if (!author.isPrivate || (req.user && req.user.id === author.id) || (author.followers.includes(currentUser.id)) ) {
      res.render("post", {
        title: "Render - Recipe",
        post,
        author
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
  //test functionality once frontend done

  try {
    const currentUser = await User.findById(req.user.id);
    const currentUserPosts = await Post.find({ author: currentUser.id });
    const friendPosts = await Promise.all(
      currentUser.following.map((friendId) => {
        return Post.find({
          author: friendId
        });
      })
    );

    let allPosts = [...currentUserPosts, ...friendPosts.flat()];
    allPosts = allPosts.sort((a, b) => b.createdAt - a.createdAt);


    // Pagination
    const currentPage = parseInt(req.query.page) || 1;
    const pageSize = 10;

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = currentPage * pageSize;
    const paginatedResults = {};
    paginatedResults.results = allPosts.slice(startIndex, endIndex);

    res.render("timeline", {
      title: "Render - Timeline",
      paginatedResults,
      currentPage,
      currentUser
    });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }

});


module.exports = router;
