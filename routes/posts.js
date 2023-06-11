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


    const prepHours = req.body.prepHours || 0;
    const cookHours = req.body.cookHours || 0;
    const prepMins = req.body.prepMins || 0;
    const cookMins = req.body.cookMins || 0;

    const totalMins = Number(prepHours * 60) + Number(cookHours * 60) + Number(prepMins) + Number(cookMins);

    const newPost = new Post({
      author: req.body.author,
      title: req.body.title,
      desc: req.body.desc,
      img: newImageName,
      ingredients: req.body.ingredients,
      instructions: req.body.instructions,
      category: req.body.category,
      servings: req.body.servings,
      prepHours: req.body.prepHours,
      prepMins: req.body.prepMins,
      cookHours: req.body.cookHours,
      cookMins: req.body.cookMins,
      totalMins: totalMins
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

    req.flash("infoSubmit", "Recipe has been posted.");
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
    if (!post.likes.includes(req.user.id)) {
      await post.updateOne({
        $push: {
          likes: req.user.id
        }
      });
      res.status(200).json("The post has been liked.");
    } else {
      await post.updateOne({
        $pull: {
          likes: req.user.id
        }
      });
      res.status(200).json("The post has been un-liked.");
    }
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
    const currentUserPosts = await Post.find({
      author: currentUser.id
    });
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
    const page = parseInt(req.query.page) || 1; // Get the requested page number
    const pageSize = 20; // Number of posts per page
    const startIndex = (page - 1) * pageSize;
    const endIndex = page * pageSize;
    const paginatedPosts = allPosts.slice(startIndex, endIndex);


    res.render("timeline", {
      title: "Render - Timeline",
      allPosts: paginatedPosts,
      currentUser,
      currentPage: page,
      totalPages: Math.ceil(allPosts.length / pageSize),
    });
  } catch (err) {
    res.status(500).json(err);
  }

});


module.exports = router;
