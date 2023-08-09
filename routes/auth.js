const router = require("express").Router();
const User = require("../models/User");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const ejs = require("ejs");


//REGISTER
router.get("/register", (req, res) => {
  res.render("register");
});

router.post("/register", async (req, res) => {

  try {
    //register user
    console.log(req.body);
    const newUser = await User.register({username: req.body.username, email: req.body.email}, req.body.password );

    if(newUser){
      passport.authenticate("local")(req, res, function(){
        res.redirect("/posts/timeline/all");
      });
    } else {
      res.statue(500).json(err);
      res.redirect("/register");
    }

  } catch (err) {
    res.status(500).json(err);
  }


});

//LOGIN
router.get("/login", (req, res) => {
  if (req.user) {
    res.redirect("/posts/timeline/all");
  } else {
      res.render("login");
  }
});

router.post("/login", passport.authenticate("local", {
  successRedirect: "/posts/timeline/all",
  failureRedirect: "/auth/login"
}));

router.post("/login/modal", passport.authenticate("local", {failureRedirect: '/auth/login', failureMessage: true}), function(req,res) {
  if(req.body.redirectUrl) {
    res.redirect(req.body.redirectUrl);
  } else {
    res.redirect("/auth/login");
  }
});


//google oauth2.0
router.get("/google",
  passport.authenticate("google", {scope: ["profile"] }));

router.get("/google/timeline/all",
  passport.authenticate("google", {failureRedirect: "/login"}),
  function (req, res) {
    res.redirect("/posts/timeline/all");
});

//LOGOUT
router.get('/logout', function(req, res, next){
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});


module.exports = router
