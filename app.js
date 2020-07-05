const express    = require("express"),
      app        = express(),
      bodyParser = require("body-parser"),
      mongoose   = require("mongoose"),
      Catcall    = require("./models/catcall");

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.set("view engine", "ejs");

const url = 'mongodb+srv://ModeratorCatcalls:OVqZGJACRvAZuiui@cluster0.h0tqu.mongodb.net/catcall?retryWrites=true&w=majority';
//const url = process.env.DATABASEURL;
//ModeratorCatcalls OVqZGJACRvAZuiui
mongoose.connect(url, {useNewUrlParser: true, useUnifiedTopology: true});

//made model, not tested yet
//try to insert something using the catcall model
//to the atlasDB, which is now linked I think






app.get("/", function(req, res){
    res.render("home");
});

app.get("/new", function(req, res){
    res.render("new");
});

app.listen(process.env.PORT || 3000, function() {
    console.log("Server started");
});