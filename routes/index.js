const   express     = require("express"),
        passport    = require("passport");
const router = express.Router({mergeParams: true});
const Catcall = require("../models/catcall");
const User = require("../models/user");
const middleware = require("../middleware");


router.get("/over", function(req, res){
    const user = req.user;
    res.render("about", {currentUser: user});
})

//INDEX ROUTES

//no register routes, because moderators are generated by the administrator (me over mongoDB Atlas manually)
//no login form, because that is part of navbar

//handling login
router.post("/login", passport.authenticate("local", {
    failureRedirect: "/catcalls",
    failureFlash: true
}), function(req, res){ 
    req.flash("success", "Je bent nu ingelogd en kunt catcalls op de lijst verifiëren en aanpassen.");
    res.redirect("/moderatorlist");
});

//logout route
router.get("/logout", function(req, res){
    req.logout();

    var isMobile = middleware.isCallerMobile(req);
    if(isMobile) {
        req.flash("success", "Je bent uitgelogd");
        res.redirect('/mobile');
    } else {
        req.flash("success", "Je bent uitgelogd");
        res.redirect("/catcalls");
    }
});

module.exports = router;