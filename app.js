const express    = require("express"),
      app        = express(),
      bodyParser = require("body-parser"),
      mongoose   = require("mongoose"),
      Catcall    = require("./models/catcall"),
      multer     = require("multer"),
      methodOverride = require("method-override");

app.use(bodyParser.urlencoded({extended: true}));
app.use('/uploads', express.static('uploads'));
app.use(express.static(__dirname + '/public'));
app.set("view engine", "ejs");
app.use(methodOverride("_method"));

//in case of Heroku, use Atlas URL, in case of localhost, use local db
const url = process.env.DATABASEURL || "mongodb://localhost/yelpcamp";
mongoose.connect(url, {useNewUrlParser: true, useUnifiedTopology: true});

//package fs gebuik ik niet meer?

app.use(function(req, res, next){
    //currentUser added to every single template
    res.locals.currentUser = req.user;
    //if there is anything in the flash, we access it through these:
    // res.locals.error = req.flash("error");
    // res.locals.success = req.flash("success");
    next();
});


//setup for multer: set folder on server and filename of images
const storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, './uploads/');
    },
    filename: function(req, file, cb){
        cb(null, file.originalname)
    }
});

//setup filters for the image upload
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png'){
        console.log("not the right file type");
        cb(null, true);
    } else {
        cb(null, false);
    }
};

//execute multer
const upload = multer({
    storage: storage, 
    limits: {
        fileSize: 1024 * 1024 * 2
    },
    fileFilter: fileFilter
});

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
            const newCatcallsData = catcallsData.replace(/\\/g, "/");
            res.render("catcalls", {catcalls: newCatcallsData});
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

//EDIT
app.get("/:id/edit", function(req, res){
    //this is where the edit form goes that moderators can use to work on the text
    Catcall.findById(req.params.id, function(err, foundCatcall){
        res.render("edit", {catcall: foundCatcall});
    })
});

//EDIT route for images
app.get("/:id/editimage", function(req, res){
    Catcall.findById(req.params.id, function(err, foundCatcall){
        if(err){
            console.log(err);
        } else {
            res.render("editimage", {catcall: foundCatcall});
        }
    });
});

//place where EDIT also takes place
app.get("/moderatorlist", function(req, res){
    //ik had hier eventueel al de filter kunnen doen met verified or not --> dat gaat het laden misschien sneller?
    Catcall.find({}, function(err, allCatcalls){
        if(err){
            console.log(err);
        } else {
            const catcallsData = JSON.stringify(allCatcalls).replace(/'/g, "\\'");
            const newCatcallsData = catcallsData.replace(/\\/g, "/");
            const catcalls = JSON.parse(newCatcallsData);
            let catcallsNotVerified = [];

            catcalls.forEach(function(catcall){
                if(!catcall.properties.verified){
                    catcallsNotVerified.push(catcall);
                }
            });
            res.render("moderatorlist", {catcallsNotVerified: catcallsNotVerified});
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
        }
    );
});

//UPDATE for adding image using multer
app.patch("/addimage/:id", upload.single('catcallImage'), function(req, res){
    Catcall.findByIdAndUpdate(
        req.params.id,
        {$set: {"properties.img": req.file.path}},
        { upsert: true, new: true },
        function(err, foundCatcall){
            if(err){
                console.log(err)
                res.redirect("/addimage/" + req.params.id);
            } else {
                res.redirect("/");
            }
        }
    );
});

//UPDATE for edit form by moderator
app.put("/:id", function(req, res){
    const newDescription = req.body.description;
    const newContext = req.body.context;
    Catcall.findByIdAndUpdate(
        req.params.id,
        {$set: {"properties.description": newDescription, "properties.context": newContext}},
        { upsert: true, new: true },
        function(err, foundCatcall){
            if(err){
                console.log(err);
                res.redirect("/" + req.params.id);
            } else {
                res.redirect("/moderatorlist");
            }
        }
    );
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