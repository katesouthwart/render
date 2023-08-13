const router = require("express").Router();
const User = require("../models/User");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const ejs = require("ejs");
const _ = require("lodash");


//REGISTER
router.get("/register", (req, res) => {
  res.render("register", {
    title: "Render - Sign Up",
  });
});

router.post("/register", async (req, res) => {
  try {

    const newUser = await User.register({username: req.body.username, usernameLower: _.lowerCase(req.body.username) ,  email: req.body.email, displayName: req.body.username}, req.body.password );

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
      res.render("login", {
        title: "Render - Log in",
      });
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
  passport.authenticate("google", {scope: ['openid', 'email', 'profile'] }));

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

// Change password
router.post('/:id/changepassword', async function(req, res) {
  try {
    if (req.user) {
      const currentUserId = req.user.id;
      const user = await User.findById(req.params.id);

      if (user.id == currentUserId) {
        const oldPassword = req.body.oldPassword;
        const newPasswordOne = req.body.newPasswordOne;
        const newPasswordTwo = req.body.newPasswordTwo;


        if (newPasswordOne === newPasswordTwo){

          if (newPasswordOne.length >= 6) {

            user.changePassword(oldPassword, newPasswordTwo, function(err) {
               if(err) {
                        if(err.name === 'IncorrectPasswordError'){
                             res.json({ success: false, message: 'Incorrect password' });
                        }else {
                          console.log(err);
                            res.json({ success: false, message: 'Something went wrong!! Please try again after sometimes.' });
                        }
              } else {
                res.json({ success: true, message: 'Your password has been changed successfully' });
               }
             })
          } else {
            res.json({ success: false, message: 'Your password must be at least 6 characters' });
           }
        }
        else {
          res.json({ success: false, message: 'New passwords do not match.' });
        }
      } else {
        res.status(500).json("You can only change your own password.");
      }
    } else {
      res.status(500).json("You must be signed in.")
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

//update username
router.post("/checkusername", async (req, res) => {
  try {
    let requestedUsername = _.lowerCase(req.body.username);
    let takenUsername = await User.findOne({usernameLower: requestedUsername})

    if (req.user && req.user.id.toString() == takenUsername.id.toString()) {
      return res.json({success: true, message: "Current Username."});
    }

    if (requestedUsername.length >= 3) {
      if (!takenUsername) {
        return res.json({success: true, message: "Username available."});
      } else {
        return res.json({success: false, message: "Username taken."});
      }
    } else {
      return res.json({success: false, message: "Username must be 3 characters or more."});
    }

  } catch (err) {
    res.status(500).json(err);
  }
});

//check password length on register
router.post("/checkpassword", async (req, res) => {
  try {
    let requestedPassword = req.body.password;

    if (requestedPassword.length >= 6) {
      return res.json({success: true, message: "Password valid."});
    } else {
      return res.json({success: false, message: "Password must be 6 characters or more."});
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router
