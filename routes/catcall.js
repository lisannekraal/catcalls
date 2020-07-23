const express = require("express");
const router = express.Router({mergeParams: true});
const Catcall = require("../models/catcall");
const User = require("../models/user");
const multer = require("multer");
const middleware = require("../middleware");

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

//INDEX ("/" and "/catcalls")
router.get("/", function(req, res){
    const user = req.user;
    Catcall.find({"properties.verified": true}, function(err, allCatcalls){
        if(err){
            console.log(err);
        } else {
            const catcallsData = JSON.stringify(allCatcalls);
            var isMobile = middleware.isCallerMobile(req);
            if(isMobile) {
                req.flash('success', 'Hier wordt straatintimidatie visueel. Check de ingezonden catcalls of doe zelf een melding.');
                req.flash('error', 'Disclaimer: bevat heftig, haatdragend, discriminerend en sexueel overschrijdend taalgebruik. Jonger van 18? Overleg dan in ieder geval met jouw voogd.')
                res.redirect('/mobile');
            } else {
                res.render("home", {catcalls: catcallsData, currentUser: user});
            }
        }
    });
});

router.get("/catcalls", middleware.checkForMobile, function(req, res){
    const user = req.user;
    Catcall.find({"properties.verified": true}, function(err, allCatcalls){
        if(err){
            console.log(err);
        } else {
            const catcallsData = JSON.stringify(allCatcalls);
            res.render("catcalls", {catcalls: catcallsData, currentUser: user});
        }
    });
});

router.get("/mobile", function(req, res){
    const user = req.user;
    Catcall.find({"properties.verified": true}, function(err, allCatcalls){
        if(err){
            console.log(err);
        } else {
            const catcallsData = JSON.stringify(allCatcalls);
            res.render("mobile", {catcalls: catcallsData, currentUser: user});
        }
    });
});

//NEW
router.get("/new", function(req, res){
    const user = req.user;
    res.render("new", {currentUser: user});
});

//CREATE
router.post("/", function(req, res){
    //retrieve information from form
    let dataFeature = req.body.date;
    if(!dataFeature){
        dataFeature = "zonder datum";
    }

    const encodedContext = encodeURI(req.body.context).replace(/'/g,"%27");
    const encodedDescription = encodeURI(req.body.description).replace(/'/g,"%27");

    //save as js object
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
            description: encodedDescription,
            date: dataFeature,
            context: encodedContext
        }
    }
    //create new Catcall and save to db
    Catcall.create(newCatcall, function(err, newlyCreated){
        if(err){
            console.log(err);
        } else {
            var isMobile = middleware.isCallerMobile(req);
            if(isMobile) {
                req.flash("success", "Bedankt voor het melden. Een moderator zal jouw catcall checken en toevoegen op de kaart.");
                res.redirect('/mobile');
            } else {
                req.flash("success", "Bedankt voor het melden. Een moderator zal jouw catcall checken en toevoegen op de kaart.");
                res.redirect("/catcalls");
            }
        }
    });
});

//EDIT
router.get("/:id/edit", middleware.isLoggedIn, function(req, res){
    const user = req.user;
    //this is where the edit form goes that moderators can use to work on the text
    Catcall.findById(req.params.id, function(err, foundCatcall){
        res.render("edit", {catcall: foundCatcall, currentUser: user});
    })
});

//EDIT route for images
router.get("/:id/editimage", middleware.isLoggedIn, function(req, res){
    const user = req.user;
    Catcall.findById(req.params.id, function(err, foundCatcall){
        if(err){
            console.log(err);
        } else {
            res.render("editimage", {catcall: foundCatcall, currentUser: user});
        }
    });
});

//EDIT also takes place
router.get("/moderatorlist", middleware.isLoggedIn, function(req, res){
    const user = req.user;
    Catcall.find({}, function(err, allCatcalls){
        if(err){
            console.log(err);
        } else {
            //of all catcalls, let's send only the verified ones in a list
            let catcallsNotVerified = [];

            allCatcalls.forEach(function(catcall){
                if(!catcall.properties.verified){
                    catcallsNotVerified.push(catcall);
                }
            });
            const notverifiedData = JSON.stringify(catcallsNotVerified);
            res.render("moderatorlist", {notverifiedData: notverifiedData, currentUser: user});
        }
    });
});

//UPDATE for verification
router.patch("/verify/:id", middleware.isLoggedIn, function(req, res){
    //use $set to only update this one and not the whole properties object
    Catcall.findByIdAndUpdate(
        req.params.id, 
        {$set: {"properties.verified": true}}, 
        { upsert: true, new: true },
        function(err, foundCatcall){
            if(err){
                console.log(err);
                req.flash("error", "Iets ging mis en het verifiëren is niet gelukt");
                res.redirect("/moderatorlist")
            } else {
                var isMobile = middleware.isCallerMobile(req);
                if(isMobile) {
                    req.flash("success", "De catcall is geverifieerd en toegevoegd op de kaart");
                    res.redirect('/mobile');
                } else {
                    req.flash("success", "De catcall is geverifieerd en toegevoegd op de kaart");
                    res.redirect("/catcalls");
                }
            }
        }
    );
});

//UPDATE for adding image using multer
router.patch("/addimage/:id", middleware.isLoggedIn, upload.single('catcallImage'), function(req, res){
    //encode image link as well as it helps with parsing data while loading map
    const encodedImageLink = encodeURI(req.file.path).replace(/'/g,"%27");
    Catcall.findByIdAndUpdate(
        req.params.id,
        {$set: {"properties.img": encodedImageLink}},
        { upsert: true, new: true },
        function(err, foundCatcall){
            if(err){
                console.log(err)
                req.flash("error", "Daar ging iets mis. De foto kan niet worden toegevoegd.");
                res.redirect("/addimage/" + req.params.id);
            } else {
                var isMobile = middleware.isCallerMobile(req);
                if(isMobile) {
                    req.flash("success", "De foto is toegevoegd aan de catcall");
                    res.redirect('/mobile');
                } else {
                    req.flash("success", "De foto is toegevoegd aan de catcall");
                    res.redirect("/catcalls");
                }
            }
        }
    );
});

//UPDATE for edit form by moderator
router.put("/:id", middleware.isLoggedIn, function(req, res){
    const newDescription = encodeURI(req.body.description).replace(/'/g,"%27");
    const newContext = encodeURI(req.body.context).replace(/'/g,"%27");
    Catcall.findByIdAndUpdate(
        req.params.id,
        {$set: {"properties.description": newDescription, "properties.context": newContext}},
        { upsert: true, new: true },
        function(err, foundCatcall){
            if(err){
                console.log(err);
                req.flash("error", "Daar ging iets mis. De catcall kan niet worden geüpdate.");
                res.redirect("/" + req.params.id);
            } else {
                req.flash("success", "De tekst van de catcall is aangepast");
                res.redirect("/moderatorlist");
            }
        }
    );
});

//DESTROY
router.delete("/:id", middleware.isLoggedIn, function(req, res){
    Catcall.findById(req.params.id, function(err, foundCatcall){
        if(err){
            console.log(err);
        } else {
            foundCatcall.remove(function(err){
                if(err){
                    console.log(err);
                    req.flash("error", "Daar ging iets mis. Het lukt niet om de catcall te verwijderen.");
                    res.redirect("/moderatorlist");
                } else {
                    req.flash("success", "De melding is verwijderd en komt niet op de kaart van catcalls");
                    res.redirect("/moderatorlist");
                }
            });
        }
    });
});


module.exports = router;