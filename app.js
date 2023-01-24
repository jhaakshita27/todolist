//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.set('strictQuery', false);
const dbUrl = "mongodb+srv://akshita068:akshitajha068@cluster0.5guivbs.mongodb.net/tododb?retryWrites=true&w=majority"
const connectparameters = { useNewUrlParser: true, useUnifiedTopology: true }
mongoose.connect(dbUrl, connectparameters)
  .then(() => {
    console.info("Connected to db");
  })
  .catch((e) => {
    console.log("Error:", e);
  });
//app.listen(3000,()=>{console.log("On 3000!")});
// const items = ["Buy Food", "Cook Food", "Eat Food"];
// const workItems = [];
const itemsSchema = {
  name: String
};
// model name is Item
const Item = mongoose.model("Item", itemsSchema);
const item1 = new Item({ name: "Welcome" });
const item2 = new Item({ name: "Use + button to add item" });
const item3 = new Item({ name: "Click checkbox to delete item" });
const defaultitems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};
// model name is List
const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
  Item.find({}, function (err, foundItems) {
    // console.log(foundItems);
    if (foundItems.length === 0) {
      Item.insertMany(defaultitems, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully saved default items to DB");
        }
      });
      res.redirect("/");
    }
    else {
      res.render("list",
        { listTitle: "Today", newListItems: foundItems });
    }
  })
});

app.get("/:custom", function (req, res) {
  const customName = _.capitalize(req.params.custom);
  List.findOne({ name: customName }, function (err, foundlist) {
    if (!err) {
      if (!foundlist) {
        // console.log("Found list doesn't exist"); Create new list
        const list = new List({ name: customName, items: defaultitems });
        list.save();
        res.redirect("/" + customName);
      }
      else {
        // console.log("Found list exists"); Show the list
        res.render("list", { listTitle: foundlist.name, newListItems: foundlist.items })
      }
    }
  })

});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({ name: itemName });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  }
  else {
    List.findOne({ name: listName }, function (err, foundlist) {
      foundlist.items.push(item);
      foundlist.save();
      res.redirect("/" + listName);
    })
  }
});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkval;
  const listName = req.body.listName;
  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function (err) {
      if (!err) {
        console.log("Successfully deleted item");
        res.redirect("/");
      }
    })
  } 
  else {
    List.findOneAndUpdate(
      {name:listName},
      {$pull:{items:{_id:checkedItemId}}},
      function (err,foundlist) {
        if(!err){
          res.redirect("/" + listName);
        }
      }
    )
  }
});

app.listen(process.env.PORT || 3000, function () {
  console.log("Server started on port 3000");
});
