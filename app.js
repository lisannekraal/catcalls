const express    = require("express"),
      app        = express(),
      bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.set("view engine", "ejs");

app.get("/", function(req, res){
    res.render("home");
});

app.listen(process.env.PORT || 3000, function() {
    console.log("Server started");
});