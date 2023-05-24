const express = require("express");
const app = express();
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const helmet = require("helmet");
const morgan = require("morgan");
const ejs = require("ejs");
const usersRoute = require("./routes/users");
const authRoute = require("./routes/auth");
const postsRoute = require("./routes/posts");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const User = require("./models/User");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");
const MongoStore = require("connect-mongo");

dotenv.config();
app.use(express.static("public"));
app.set("view engine", "ejs");

mongoose.connect(process.env.MONGO_URL)
  .then(function(){
    console.log("Connected to MongoDB.");
  });

//middlewares
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(helmet());
app.use(morgan("common"));

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'", 'ka-f.fontawesome.com'],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdnjs.cloudflare.com', 'cdn.jsdelivr.net', 'kit.fontawesome.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://stackpath.bootstrapcdn.com', 'https://cdnjs.cloudflare.com', 'cdn.jsdelivr.net', 'use.fontawesome.com'],
      fontSrc: ["'self'", 'https://stackpath.bootstrapcdn.com', 'https://cdnjs.cloudflare.com', 'use.fontawesome.com', 'ka-f.fontawesome.com'],
      imgSrc: ["'self'", 'data:'],
      objectSrc: ["'none'"],
      mediaSrc: ["'none'"],
      frameSrc: ["'none'"]
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
  callbackURL: "http://localhost:3000/auth/google/timeline/all"
},
function(accessToken, refreshToken, profile, cb) {
  User.findOrCreate({username: profile.displayName, googleId: profile.id},
  function(err, user){
    return cb(err, user);
  });
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

app.get("/", (req, res) => {
  res.render("home");
});


app.listen(3000, () => {
  console.log("Server is running on port 3000.");
});
