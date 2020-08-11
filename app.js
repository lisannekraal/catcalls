const express    = require("express"),
      app        = express(),
      bodyParser = require("body-parser"),
      mongoose   = require("mongoose"),
      multer     = require("multer"),
      methodOverride = require("method-override"),
      passport       = require("passport"),
      LocalStrategy  = require("passport-local"),
      flash      = require("connect-flash"),
      request    = require("request");

//ROUTES
const catcallRoutes = require("./routes/catcall");
const indexRoutes = require("./routes/index");

//MODELS
const User = require("./models/user");

//CREATE USER manually
// User.register(new User({username: "username"}), "password", function(err, user){
//     if(err){
//         console.log(err);
//     }
//     passport.authenticate("local")(function(){
//         console.log("user added");
//     });
// });

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json()); //do this for the captcha part?
app.use('/uploads', express.static('uploads'));
app.use(express.static(__dirname + '/public'));
app.set("view engine", "ejs");
app.use(methodOverride("_method"));
app.use(flash());
app.use(require("express-session")({
    secret: "jhskvlwiejafkebfemjf",
    resave: false,
    saveUninitialized: false
}));

//in case of Heroku, use Atlas URL, in case of localhost, use local db
const url = process.env.DATABASEURL || "mongodb://localhost/catcalls";
mongoose.connect(url, {useNewUrlParser: true, useUnifiedTopology: true});

//package fs gebuik ik niet meer?

app.use(function(req, res, next){
    //currentUser added to every single template
    res.locals.currentUser = req.user;
    //if there is anything in the flash, we access it through these:
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

//setup user authentication through password
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//ROUTES=====================================================================================
//1. for catcalls => all in routes/catcall.js
//INDEX     /               GET
//NEW       /new            GET
//CREATE    /               POST
//....SHOW                  SHOW            not in use
//EDIT      /moderatorlist  GET             lists all catcalls to edit through verification
//UPDATE    /verify/:id     PATCH           
//EDIT      /:id/edit       GET             Moderators adjusting text
//UPDATE    /addimage/:id   PATCH
//EDIT      /:id/editimage  GET             Page for uploading images
//UPDATE    /:id            PUT
//DESTROY   /:id            DELETE
//
//2. for users
//

app.use(catcallRoutes);
app.use(indexRoutes);

app.listen(process.env.PORT || 3000, function() {
    console.log("Server started");
});