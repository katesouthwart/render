const router = require("express").Router();
const mongoose = require("mongoose");
const Discover = require("../models/Discover");
const User = require("../models/User");
const fs = require("fs");
const path = require("path");

//GET Discover page and cards
router.get("/", async (req, res) => {
  try {
    if (req.user) {
      let currentUser = req.user;
      let currentUserDiscovered = await Discover.findOne({user: currentUser.id});

      const currentUserFollowing = currentUser.following;

      const currentUserRejected = currentUser.rejected;

      const discoveredUsers = await Discover.aggregate([
        {
          $lookup: {
            from: "users",
            localField: "user",
            foreignField: "_id",
            as: "userData"
          }
        },
        {
          $match: {
            "userData.isAuthor": true,
            "userData.isPrivate": false,
            "user": {
              $nin: [currentUser.id, ...currentUserFollowing, ...currentUserRejected],
              $ne: currentUser.id
            }
          }
        },
        {
          // $limit: 1
          $sample: {size: 1}
        }
      ]);

      const discoveredUsersWithInfo = discoveredUsers.map(result => ({
        discover: result,
        user: result.userData[0]
      }));

      let filteredUsers = discoveredUsersWithInfo.filter(function(discoverableUser) {
          return !(
              discoverableUser.user._id == currentUser.id ||
              currentUser.following.includes(discoverableUser.user._id.toString()) ||
              currentUser.rejected.includes(discoverableUser.user._id.toString()) ||
              discoverableUser.discover.img1 === ''
          );
      });

      let filteredUsersCount = filteredUsers.length;
      console.log(filteredUsersCount);



      res.render("discover", {
        title: "Render - Discover",
        discoverableUsers: filteredUsers,
        currentUser,
        currentUserDiscovered
      });

    } else {
      res.redirect("/auth/login");
    }
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

//User's choice
router.post("/userchoice", async (req, res) => {
  const viewedUser = await User.findById(req.body.id);
  const currentUser = await User.findById(req.user.id);

  if (req.body.choice == 'follow') {
    await viewedUser.updateOne({
      $push: {
        followers: currentUser.id
      }
    });
    await currentUser.updateOne({
      $push: {
        following: viewedUser.id
      }
    });
    console.log('following!');
  } else {
    console.log('rejected');
  }
  return res.status(200).json({
    success: true,
    message: "User action success"
  });
});

//GET discover card editing page
router.get("/:id/settings", async (req, res) => {
  try {
    if (req.user && req.user.id == req.params.id) {
      const currentUser = await User.findById(req.user.id);
      const alreadyDiscoverable = await Discover.findOne({ user: currentUser.id });
      console.log(alreadyDiscoverable);

      if (alreadyDiscoverable) {
        res.render("discover_edit", {
          title: "Render - Get Discovered",
          user: currentUser,
          card: alreadyDiscoverable
        });

      } else {
        console.log(currentUser.id);
        const newDiscover = new Discover({
          user: currentUser.id,
          img1: "",
          img2: "",
          img3: "",
          img4: "",
          img5: "",
          img6: "",
          diet: "No Limits",
          desc: "",
        });

        const savedDiscover = await newDiscover.save();
        const nowDiscoverable = await Discover.findOne({
          user: currentUser.id
        });

        res.render("discover_edit", {
          title: "Render - Get Discovered",
          user: currentUser,
          card: nowDiscoverable
        });
      }
    } else {
      res.redirect("/auth/login")
    }
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

//POST discover card edit
router.post("/:id/settings", async (req, res) => {
  try {
    if (req.user && req.user.id === req.params.id || req.user.isAdmin) {
      const currentUserId = req.user.id;
      const card = await Discover.findOne({ user: req.user.id });

      //Image upload
      let imageUploadFile;
      let uploadPath;
      let imageNames = [];
      let currentImageName;

      if (!req.files || Object.keys(req.files).length === 0) {
        console.log("No files uploaded");
      } else {

        let index = 0;
        for (const key in req.files) {
          if (Object.hasOwnProperty.call(req.files, key)) {
            const imageUploadFile = req.files[key];
            const newImageName = Date.now() + imageUploadFile.name + req.user.id;
            imageNames.push(newImageName);
            const uploadPath = path.resolve("./") + "/public/uploads/" + newImageName;

            console.log(imageNames);

            imageUploadFile.mv(uploadPath, function(err) {
              if (err) {
                console.log(err);
                return res.status(500).send(err);
              }
            });

            let currentImageName = card['img' + (index + 1)];

            if (currentImageName !== "flame.PNG" && currentImageName !== newImageName) {
              const oldImagePath = path.resolve("./") + "/public/uploads/" + currentImageName;
              try {
                fs.unlinkSync(oldImagePath);
                console.log("Old image deleted:", oldImagePath);
              } catch (err) {
                console.error("Error deleting old image:", err);
              }
            }
            index++;
          }
        }
      }
      const updateObj = {};
      for (let i = 0; i < Math.min(6, imageNames.length); i++) {
        updateObj[`img${i + 1}`] = imageNames[i];
      }
      const updateImg = await Discover.findByIdAndUpdate(card.id, updateObj);
      const savedImg = await updateImg.save();

      await card.updateOne({ $set: req.body});

      res.redirect("/discover/" + currentUserId + "/settings")

    } else {
      res.status(500).json("You can only update your own profile!");
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router
