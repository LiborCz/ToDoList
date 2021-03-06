//jshint esversion:6

require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
var path = require('path');
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-libor:" + process.env.MongoDB_Pwd + "@cluster0-depo4.mongodb.net/todolistDB", {useNewUrlParser: true, useUnifiedTopology: true });
mongoose.set('useFindAndModify', false);

const itemsSchema = {name: String};

const Item = mongoose.model("Item", itemsSchema);


const item1 = new Item({name: "Welcome to your todolist!"});
const item2 = new Item({name: "Hit the + button to add a new item."});
const item3 = new Item({name: "<-- Hit this to delete an item."});
const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/hello", (req, res) => {
  res.sendFile(path.join(__dirname, './public', 'index.html'));
});

app.get("/img/:file", (req, res) => {
  res.sendFile(path.join(__dirname, './public/img', req.params.file));
});

app.get("/css/:file", (req, res) => {
  res.sendFile(path.join(__dirname, './public/css', req.params.file));
});

app.get("/", function(req, res) {
  res.redirect("/today");
});

// app.get("/", function(req, res) {

//   Item.find({}, function(err, foundItems){

//     if (foundItems.length === 0) {
//       Item.insertMany(defaultItems, function(err){
//         if (err) {
//           console.log(err);
//         } else {
//           console.log("Successfully saved default items to DB.");
//         }
//       });
//       res.redirect("/");
//     } else {
//       res.render("list", {listTitle: "Today", newListItems: foundItems});
//     }
//   });
// });


app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);

  if(customListName=="favicon.ico") {
    console.log("Now I was hitting the favicon.ico");
    return;
  }
  
  List.findOne({name: customListName}, function(err, foundList){
    if (!err){
      if (!foundList){
        //Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        //Show the existing list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  console.log(item);
  
  if (listName === "Today"){
    item.save();
    console.log("Saving item:");
    console.log(item);
    res.redirect("/");
    
  } else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      console.log("Successfully saved a new item.");
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function(err){
      if (!err) {
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
      if (!err){
        console.log("Successfully deleted checked item.");
        res.redirect("/" + listName);
      }
    });
  }


});

app.get("/about", function(req, res){
  console.log("I am rendering to about page...");
  res.render("about");
});



let port = process.env.PORT;
if (port == null || port == "") port = 4000;

app.listen(port, function() {
  console.log(`Server started successfully on port ${port}!!`);
});
