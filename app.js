const express = require("express");
const app = express();

const _ = require("lodash");

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

const mongoose = require("mongoose");
mongoose
    .connect(
        "mongodb+srv://srikars2001:srikar2001@cluster0.4vtrp.mongodb.net/myToDoList?retryWrites=true&w=majority",
        {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        }
    )
    .then(() => console.log("Successfully Connected to DataBase"))
    .catch((e) => console.log(""));

// *****************************************************************
const itemsSchema = new mongoose.Schema({
    name: String,
});

const Item = mongoose.model("Item", itemsSchema);

const defaultItems = [
    { name: "Welcome to your todolist!" },
    { name: "Hit the + button to add a new item." },
    { name: "← Hit this to delete an item." },
];

// ***************************************************************

app.get("/", (req, res) => {
    Item.find({})
        .then((foundItems) => {
            if (foundItems.length === 0) {
                Item.insertMany(defaultItems)
                    .then(() =>
                        console.log("Successfully savevd default items to DB.")
                    )
                    .then(() => res.redirect("/"))
                    .catch((e) => console.log(e));
            } else {
                res.render("list", {
                    listTitle: "Welcome",
                    newListItems: foundItems,
                });
            }
        })
        .catch((e) => console.log(e));
});

// *******************************************************************

const listSchema = new mongoose.Schema({
    name: String,
    items: [itemsSchema],
});

const List = mongoose.model("List", listSchema);

// *****************************************************************

app.get("/:customListName", (req, res) => {
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({ name: customListName })
        .then((foundList) => {
            if (!foundList) {
                const list = new List({
                    name: customListName,
                    items: defaultItems,
                });
                list.save()
                    .then(() => res.redirect(`/${customListName}`))
                    .catch((e) => console.log(e));
            } else {
                res.render("list", {
                    listTitle: foundList.name,
                    newListItems: foundList.items,
                });
            }
        })
        .catch((e) => console.log(e));
});

// **************************************************************************

app.post("/", (req, res) => {
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName,
    });

    if (listName === "Welcome") {
        res.redirect(`/${itemName}`);
    } else {
        List.findOne({ name: listName })
            .then((foundList) => {
                foundList.items.push(item);
                foundList
                    .save()
                    .then(() => res.redirect(`/${listName}`))
                    .catch((e) => console.log(e));
            })
            .catch((e) => console.log(e));
    }
});

// ***********************************************************************

app.post("/delete", (req, res) => {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Welcome") {
        Item.findByIdAndRemove(checkedItemId)
            .then(() => {
                console.log("Successfully deleted checked item.");
                res.redirect("/");
            })
            .catch((e) => console.log(e));
    } else {
        List.findOneAndUpdate(
            { name: listName },
            { $pull: { items: { _id: checkedItemId } } }
        )
            .then(() => {
                console.log("Successfully deleted checked item.");
                res.redirect(`/${listName}`);
            })
            .catch((e) => console.log(e));
    }
});

// ***********************************************************************

app.get("/about", (req, res) => {
    res.render("about");
});

app.listen(3000, () => {
    console.log("Server started on port 3000");
});
