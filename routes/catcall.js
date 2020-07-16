const express = require("express");
const router = express.Router({mergeParams: true});
const Catcall = require("../models/catcall");
const multer = require("multer");

///MULTER

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

//ROUTES

//INDEX
router.get("/", function(req, res){
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
router.get("/new", function(req, res){
    res.render("new");
});

//CREATE
router.post("/", function(req, res){
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
router.get("/:id/edit", function(req, res){
    //this is where the edit form goes that moderators can use to work on the text
    Catcall.findById(req.params.id, function(err, foundCatcall){
        res.render("edit", {catcall: foundCatcall});
    })
});

//EDIT route for images
router.get("/:id/editimage", function(req, res){
    Catcall.findById(req.params.id, function(err, foundCatcall){
        if(err){
            console.log(err);
        } else {
            res.render("editimage", {catcall: foundCatcall});
        }
    });
});

//EDIT also takes place
router.get("/moderatorlist", function(req, res){
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
router.patch("/verify/:id", function(req, res){
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
router.patch("/addimage/:id", upload.single('catcallImage'), function(req, res){
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
router.put("/:id", function(req, res){
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
router.delete("/:id", function(req, res){
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

module.exports = router;