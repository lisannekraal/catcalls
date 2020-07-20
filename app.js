const express    = require("express"),
      app        = express(),
      bodyParser = require("body-parser"),
      mongoose   = require("mongoose"),
      multer     = require("multer"),
      methodOverride = require("method-override"),
      flash      = require("connect-flash");

const catcallRoutes = require("./routes/catcall");

app.use(bodyParser.urlencoded({extended: true}));
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

app.use(catcallRoutes);

app.listen(process.env.PORT || 3000, function() {
    console.log("Server started");
});