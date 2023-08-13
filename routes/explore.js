const router = require("express").Router();
const Category = require("../models/Category");
const Post = require("../models/Post");
const User = require("../models/User");
const paginateResults = require("../public/js/pagination");

//GET Explore
router.get("/", async (req, res) => {
  try {
    const limitNumber = 5;
    const categories = await Category.find({}).limit(limitNumber);
    const nonPrivateUsers = await User.find({ isPrivate: false});
    const latest = await Post.find({ author: { $in: nonPrivateUsers } }).sort({_id: -1}).limit(limitNumber);
    // const american = await Post.find({ "category": "American", author: { $in: nonPrivateUsers } }).sort({_id: -1}).limit(limitNumber);
    const thirtyMinsOrLess = await Post.find({ totalMins: { $lt: 31}, author: { $in: nonPrivateUsers } }).sort({_id: -1}).limit(limitNumber);
    const food = { latest, thirtyMinsOrLess };

    res.render("explore", {
      title: "Render - Explore",
      categories,
      food
    });
  } catch (err) {
    res.status(500).json(err)
  }
});

//GET search
router.get("/search", async (req, res) => {
  try{
    const searchTerm = req.query.searchTerm;
    const nonPrivateUsers = await User.find({ isPrivate: false});
    const posts = await Post.find( { author: { $in: nonPrivateUsers }, $text: { $search: searchTerm, $diacriticSensitive: true } } ).sort({ _id: -1 });
    const pageHeading = "Search Results: " + searchTerm;
    const activeBreadcrumb = searchTerm + " Recipes";

    await paginateResults(req, res, posts, {});
    const paginatedResults = res.paginatedResults;

    res.render("posts_directory", {
      title: "Render - Search Results",
      posts: paginatedResults.results,
      previousPage: paginatedResults.previous ? paginatedResults.previous.page : null,
      nextPage: paginatedResults.next ? paginatedResults.next.page : null,
      currentPage: req.query.page || 1,
      totalPages: Math.ceil(posts.length / 20),
      searchTerm,
      pageHeading,
      activeBreadcrumb
     });
  } catch (err) {
    res.status(500).json(err);
  }
});

//GET Latest Recipes
router.get("/latest", async (req, res) => {
  try {

    const nonPrivateUsers = await User.find({ isPrivate: false});
    const posts = await Post.find({ author: { $in: nonPrivateUsers }}).sort({ _id: -1 });
    const pageHeading = "Explore the Latest Recipes";
    const activeBreadcrumb = "Explore Latest";

    await paginateResults(req, res, posts, {});
    const paginatedResults = res.paginatedResults;

    res.render("posts_directory", {
      title: "Render - Explore Latest",
      posts: paginatedResults.results,
      previousPage: paginatedResults.previous ? paginatedResults.previous.page : null,
      nextPage: paginatedResults.next ? paginatedResults.next.page : null,
      currentPage: req.query.page || 1,
      totalPages: Math.ceil(posts.length / 20),
      pageHeading,
      activeBreadcrumb
     });
  } catch (err) {
    res.status(500).json(err);
  }
});

//GET Thirty Minutes or Less
router.get("/ThirtyMinutesOrLess", async (req, res) => {
  try {
    const nonPrivateUsers = await User.find({ isPrivate: false});
    const posts = await Post.find({ author: { $in: nonPrivateUsers }, totalMins: { $lt: 31} }).sort({ _id: -1 });
    const pageHeading = "Ready in 30 Minutes or Less";
    const activeBreadcrumb = "Thirty Minutes or Less";

    await paginateResults(req, res, posts, {});
    const paginatedResults = res.paginatedResults;

    res.render("posts_directory", {
      title: "Render - 30 Minutes or less",
      posts: paginatedResults.results,
      previousPage: paginatedResults.previous ? paginatedResults.previous.page : null,
      nextPage: paginatedResults.next ? paginatedResults.next.page : null,
      currentPage: req.query.page || 1,
      totalPages: Math.ceil(posts.length / 20),
      pageHeading,
      activeBreadcrumb
    });
  } catch (err) {
    res.status(500).json(err);
  }
});

router.get("/random", async (req, res) => {
  try {
    let publicUserCount = await User.find({ isPrivate: false, isAuthor: true }).countDocuments();
    let randomPublicUser = Math.floor(Math.random() * publicUserCount);
    let randomUser = await User.findOne({ isPrivate: false, isAuthor: true }).skip(randomPublicUser).exec();
    let randomUserId = randomUser.id;

    let postCount = await Post.find({ author: randomUserId }).countDocuments();
    let randomPost = Math.floor(Math.random() * postCount);
    let post = await Post.findOne({ author: randomUserId }).skip(randomPost).exec();

    res.redirect("/posts/" + post.id);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
