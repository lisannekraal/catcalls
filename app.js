const express    = require("express"),
      app        = express(),
      bodyParser = require("body-parser"),
      mongoose   = require("mongoose"),
      Catcall    = require("./models/catcall");

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.set("view engine", "ejs");

const url = 'mongodb+srv://ModeratorCatcalls:OVqZGJACRvAZuiui@cluster0.h0tqu.mongodb.net/catcall?retryWrites=true&w=majority';
//const url = process.env.DATABASEURL || 'mongodb+srv://ModeratorCatcalls:OVqZGJACRvAZuiui@cluster0.h0tqu.mongodb.net/catcall?retryWrites=true&w=majority';
//ModeratorCatcalls OVqZGJACRvAZuiui
mongoose.connect(url, {useNewUrlParser: true, useUnifiedTopology: true});

//mongoose and heroku nog niet goed geconnect!!
//


app.get("/", function(req, res){
    //get all catcalls from database to send along with home
    Catcall.find({}, function(err, allCatcalls){
        if(err){
            console.log(err);
        } else {
            res.render("home", {catcalls: allCatcalls});
        }
    })

    //res.render("home");
});

//FORM TO MAKE A NEW CATCALL
app.get("/new", function(req, res){
    res.render("new");
});

//CREATE A NEW CATCALL/POST REQUEST
app.post("/", function(req, res){
    //retrieve information from form and save as object
    const newCatcall = {
        type: 'Feature',
        geometry: {
            type: 'Point',
            coordinates: [
                Number(req.body.long),
                Number(req.body.lat)
            ]
        },
        properties: {
            description: req.body.description,
            date: req.body.date,
            context: req.body.context
        }
    }

    //create new Catcall and save to db
    Catcall.create(newCatcall, function(err, newlyCreated){
        if(err){
            console.log(err);
        } else {
            //req.flash("success", "");
            res.redirect("/");
        }
    });
})

app.listen(process.env.PORT || 3000, function() {
    console.log("Server started");
});