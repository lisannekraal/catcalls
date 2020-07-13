const express    = require("express"),
      app        = express(),
      bodyParser = require("body-parser"),
      mongoose   = require("mongoose"),
      Catcall    = require("./models/catcall"),
      multer     = require("multer"),
      multerfs   = require("multer-gridfs-storage");

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.set("view engine", "ejs");

//const url = 'mongodb+srv://ModeratorCatcalls:OVqZGJACRvAZuiui@cluster0.h0tqu.mongodb.net/catcall?retryWrites=true&w=majority';
const url = process.env.DATABASEURL || 'mongodb+srv://ModeratorCatcalls:OVqZGJACRvAZuiui@cluster0.h0tqu.mongodb.net/catcall?retryWrites=true&w=majority';
//ModeratorCatcalls OVqZGJACRvAZuiui
mongoose.connect(url, {useNewUrlParser: true, useUnifiedTopology: true});


//tekst kan alleen nog worden ingevoerd als in plaats van ' dit gebruiken: \u0060
////////is dit niet al oplgelost?
///////checken later of ik multer wel gebruik
//package fs gebuik ik niet meer?

app.use(function(req, res, next){
    //currentUser added to every single template
    res.locals.currentUser = req.user;
    //if there is anything in the flash, we access it through these:
    // res.locals.error = req.flash("error");
    // res.locals.success = req.flash("success");
    next();
});

var upload = multer({dest:'./uploads'});

//ROUTES==================================================================================

app.get("/", function(req, res){
    //get all catcalls from database to send along with home
    Catcall.find({}, function(err, allCatcalls){
        if(err){
            console.log(err);
        } else {
            const catcallsData = JSON.stringify(allCatcalls).replace(/'/g, "\\'"); 
            res.render("catcalls", {catcalls: catcallsData});
        }
    });
});

//FORM TO MAKE A NEW CATCALL
app.get("/new", function(req, res){
    res.render("new");
});

//CREATE A NEW CATCALL/POST REQUEST
app.post("/", upload.single('avatar'), function(req, res){
    //retrieve information from form and save as object
    let dataFeature = req.body.date;
    if(!dataFeature){
        dataFeature = "zonder datum";
    }
    console.log(req.file);

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
            date: dataFeature,
            context: req.body.context
                        // img: { 
            //     data: req.file.path, 
            //     contentType: "image/png" 
            // }
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
});

app.get("/moderatorlist", function(req, res){
    //ik had hier eventueel al de filter kunnen doen met verified or not --> dat gaat het laden misschien sneller?
    Catcall.find({}, function(err, allCatcalls){
        if(err){
            console.log(err);
        } else {
            const catcallsData = JSON.stringify(allCatcalls).replace(/'/g, "\\'"); 
            res.render("moderatorlist", {catcalls: catcallsData});
        }
    });
});

app.get("/moderator/edit", function(req, res){
    res.render("moderatoredit");
});

app.listen(process.env.PORT || 3000, function() {
    console.log("Server started");
});