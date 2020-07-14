const express    = require("express"),
      app        = express(),
      bodyParser = require("body-parser"),
      mongoose   = require("mongoose"),
      Catcall    = require("./models/catcall"),
      multer     = require("multer"),
      methodOverride = require("method-override"),
      multerfs   = require("multer-gridfs-storage");

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(methodOverride("_method"));

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
//1. for catcalls
//INDEX     /           GET
//NEW       /new        GET
//CREATE    /           POST
//SHOW      /:id        GET             Is not in use, because the map is used to show individual listings
//EDIT      /:id/edit   GET             Verification/adding pictures done on map and page /moderatorlist + seperate edit page
//UPDATE    /:id        PUT
//DESTROY   /:id        DELETE


//INDEX
app.get("/", function(req, res){
    //get all catcalls from database to send along with home
    Catcall.find({"properties.verified": true}, function(err, allCatcalls){
        if(err){
            console.log(err);
        } else {
            const catcallsData = JSON.stringify(allCatcalls).replace(/'/g, "\\'"); 
            res.render("catcalls", {catcalls: catcallsData});
        }
    });
});

//NEW
app.get("/new", function(req, res){
    res.render("new");
});

//CREATE
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

app.get("/:id/edit", function(req, res){
    //this is where the edit form goes that moderators can use to work on the text
});

//place where EDIT also takes place
app.get("/moderatorlist", function(req, res){
    //ik had hier eventueel al de filter kunnen doen met verified or not --> dat gaat het laden misschien sneller?
    Catcall.find({}, function(err, allCatcalls){
        if(err){
            console.log(err);
        } else {
            const catcallsData = JSON.stringify(allCatcalls).replace(/'/g, "\\'");
            const catcalls = JSON.parse(catcallsData);
            res.render("moderatorlist", {catcalls: catcalls});
        }
    });
});

//UPDATE for verification
app.patch("/verify/:id", function(req, res){
    //use $set to only update this one and not the whole properties object
    Catcall.findByIdAndUpdate(
        req.params.id, 
        {$set: {"properties.verified": true}}, 
        { upsert: true, new: true },
        function(err, foundCatcall){
        if(err){
            console.log(err);
            res.redirect("/moderatorlist")
        } else {
            res.redirect("/");
        }
    })
});

//UPDATE
app.put("/:id", function(req, res){
    //this is where the update route goed for updating verification process and adding pictures
});

//DESTROY
app.delete("/:id", function(req, res){
    Catcall.findById(req.params.id, function(err, foundCatcall){
        if(err){
            console.log(err);
        } else {
            foundCatcall.remove(function(err){
                if(err){
                    console.log(err);
                    res.redirect("/moderatorlist");
                } else {
                    res.redirect("/moderatorlist");
                }
            });
        }
    });
});

app.listen(process.env.PORT || 3000, function() {
    console.log("Server started");
});