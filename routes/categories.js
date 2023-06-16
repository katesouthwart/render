const router = require("express").Router();
const Category = require("../models/Category");
const Post = require("../models/Post");
const User = require("../models/User");
const paginateResults = require("../public/js/pagination");


//Create a category
router.post("/", async (req, res) => {

  if(req.user && req.user.isAdmin){

    const newCategory = new Category(req.body);

    try {
      const savedCategory = await newCategory.save();
      res.redirect("/categories/" + savedCategory);
    } catch (err) {
      res.status(500).json(err);
    }

  } else {
    res.status(403).json("Only admins can create categories.");
  }

});

//Get a category
router.get("/:name", async (req, res) => {

  try {

    const category = await Category.findOne({ name: req.params.name });
    const nonPrivateUsers = await User.find({ isPrivate: false});
    const posts = await Post.find({ author: {$in: nonPrivateUsers}, category: req.params.name }).sort({ _id: -1 });

    await paginateResults(req, res, posts, {});

    const paginatedResults = res.paginatedResults;

    res.render("categories", {
      category,
      posts: paginatedResults.results,
      previousPage: paginatedResults.previous ? paginatedResults.previous.page : null,
      nextPage: paginatedResults.next ? paginatedResults.next.page : null,
      currentPage: req.query.page || 1,
      totalPages: Math.ceil(posts.length / 20)
    });


  } catch (err) {
    res.status(500).json(err);
  }

});

//Get all categories
router.get("/", async (req, res) => {

  try {

    const categories = await Category.find({});

    await paginateResults(req, res, categories, {});

    const paginatedResults = res.paginatedResults;


    res.render("categories_all", {
      title: "Render - Categories",
      categories: paginatedResults.results,
      previousPage: paginatedResults.previous ? paginatedResults.previous.page : null,
      nextPage: paginatedResults.next ? paginatedResults.next.page : null,
      currentPage: req.query.page || 1,
      totalPages: Math.ceil(categories.length / 20)
    });

  } catch (err) {
    console.log(err);
    res.status(500).json(err)
  }

});

//Update a category
router.put("/:name", async (req, res) => {

  if(req.user && req.user.isAdmin){

    try {
      const category = await Category.findOne({ name: req.params.name });
      await category.updateOne({ $set: req.body });
      res.status(200).json("Category successfully updated.");
    } catch (err) {
      res.status(500).json(err);
    }

  } else {
    res.status(403).json("Only admins can edit categories.");
  }


});

//Delete a category
router.delete("/:name", async (req, res) => {

  if(req.user && req.user.isAdmin){

    try {
      const category = await Category.findOne({ name: req.params.name });
      await category.deleteOne();
      res.status(200).json("Category successfully deleted.");
    } catch (err) {
      res.status(500).json(err);
    }

  } else {
    res.status(403).json("Only admins can delete categories.");
  }

});



// async function insertDummyCategoryData(){
//
//   try {
//     await Category.insertMany([
//       {
//         "name": "British",
//         "icon": "fas fa-bread-slice",
//       },
//       {
//         "name": "French",
//         "icon": "fas fa-cheese",
//       },
//
//     ]);
//
//   } catch (err) {
//     console.log(err);
//   }
// }
//
// insertDummyCategoryData();
//
//




module.exports = router;
