const express = require("express");
const port = 3000;
const app = express();
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const helmet = require("helmet");
const morgan = require("morgan");
const ejs = require("ejs");
const expressLayouts = require("express-ejs-layouts");
const usersRoute = require("./routes/users");
const authRoute = require("./routes/auth");
const postsRoute = require("./routes/posts");
const exploreRoute = require("./routes/explore");
const categoryRoute = require("./routes/categories");
const commentsRoute = require("./routes/comments");
const discoverRoute = require("./routes/discover");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const User = require("./models/User");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");
const MongoStore = require("connect-mongo");
const fileUpload = require("express-fileupload");
const cookieParser = require("cookie-parser");
const flash = require("connect-flash");
const https = require("https");

dotenv.config();
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(expressLayouts);
app.set("layout", "./layouts/main");

mongoose.connect(process.env.MONGO_URL)
  .then(function(){
    console.log("Connected to MongoDB.");
  });

//middlewares
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(helmet());
app.use(morgan("common"));


app.use(cookieParser(process.env.COOKIE_PARSER_SECRET));

app.use(flash());
app.use(fileUpload());

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'", 'ka-f.fontawesome.com'],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdnjs.cloudflare.com', 'cdn.jsdelivr.net', 'kit.fontawesome.com', 'https://code.jquery.com/jquery-3.7.0.min.js'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://stackpath.bootstrapcdn.com', 'https://cdnjs.cloudflare.com', 'cdn.jsdelivr.net', 'use.fontawesome.com', 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://stackpath.bootstrapcdn.com', 'https://cdnjs.cloudflare.com', 'use.fontawesome.com', 'ka-f.fontawesome.com', 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'blob:'],
      objectSrc: ["'none'"],
      mediaSrc: ["'none'"],
      frameSrc: ["'none'"],
      scriptSrcAttr: ["'unsafe-inline'"],
    }
  })
);

//Set up session
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URL }),
}));

//Initialize and start using Passport
app.use(passport.initialize());
app.use(passport.session());

passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
  done(null, user.id);
});
passport.deserializeUser(async function (id, done) {
  let err, user;
  try {
      user = await User.findById(id).exec();
  }
  catch (e) {
      err = e;
  }
  done(err, user);
});

//google oauth2.0
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "https://www.rendersocial.io/auth/google/timeline/all"
},
async function(accessToken, refreshToken, profile, cb) {

  try {

    const existingUser = await User.findOne({ googleId: profile.id });

    if (existingUser) {
      return cb(null, existingUser);
    }

    const newUser = new User({
      displayName: profile.displayName,
      googleId: profile.id,
      email: profile._json.email,
    });

    newUser.username = "user" + newUser._id;

    await newUser.save();
    return cb(null, newUser);
  } catch (err) {
    return cb(err, null);
  }
}));

//Check isAuthenticated
app.use((req, res, next) => {
  res.locals.user = req.user;
  res.locals.isAuthenticated = req.isAuthenticated();
  next();
});

//Routes
app.use("/users", usersRoute);
app.use("/auth", authRoute);
app.use("/posts", postsRoute);
app.use("/categories", categoryRoute);
app.use("/explore", exploreRoute);
app.use("/comments", commentsRoute);
app.use("/discover", discoverRoute);

app.get("/", (req, res) => {
  if (req.user) {
    res.redirect("/posts/timeline/all");
  } else {
    res.render("home");
  }
});

app.post("/iosnewsletter", (req, res) => {
  const firstName = req.body.fName;
  const lastName = req.body.lName;
  const email = req.body.email;

  const data = {
    email_address: email,
    status: "subscribed",
    merge_fields: {
      FNAME: firstName,
      LNAME: lastName
    }
  }

  const jsonData = JSON.stringify(data);
  const audienceID = process.env.MAILCHIMP_AUDIENCE_ID;
  const options = {
    method: "POST",
    auth: process.env.MAILCHIMP_IOS_API_KEY
  }

  const url = process.env.MAILCHIMP_URL;
  const request = https.request(url, options, response => {

    response.on("data", data => {
      if (response.statusCode === 200) {
          return res.json({success: true, message: "Successfully subscribed."});
      } else {
        return res.json({success: false, message: "An error has occured."});
      }
    })
  })

  request.write(jsonData);
  request.end();
});

app.post("/androidnewsletter", (req, res) => {
  const firstName = req.body.androidFName;
  const lastName = req.body.androidLName;
  const email = req.body.androidEmail;

  const data = {
    email_address: email,
    status: "subscribed",
    merge_fields: {
      FNAME: firstName,
      LNAME: lastName
    }
  }

  const jsonData = JSON.stringify(data);
  const audienceID = process.env.MAILCHIMP_AUDIENCE_ID;
  const options = {
    method: "POST",
    auth: process.env.MAILCHIMP_ANDROID_API_KEY
  }

  const url = process.env.MAILCHIMP_URL;
  const request = https.request(url, options, response => {

    response.on("data", data => {
      if (response.statusCode === 200) {
        return res.json({success: true, message: "Successfully subscribed."});
      } else {
        return res.json({success: false, message: "An error has occured."});
      }
    })
  })

  request.write(jsonData);
  request.end();
});


app.listen(process.env.PORT || port, () => {
  console.log("Server is running on port 3000.");
});
