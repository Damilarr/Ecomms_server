const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const app = express();
const { ObjectId } = require("mongodb");
const { OAuth2Client } = require("google-auth-library");
dotenv.config();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
app.use(express.json());

// cors
let cors = require("cors");
app.use(cors());

const PORT = 5000;
mongoose.connect(
  "mongodb+srv://Imaxx:imaxx66@cluster0.fljasqv.mongodb.net/?retryWrites=true&w=majority"
);
let db = mongoose.connection;
const Products = db.collection("ecommerce_products");
db.once("open", function () {
  console.log("DATABASE CONNECTED");
});

const User = mongoose.model(
  "Ecomms_User",
  new mongoose.Schema({
    name: String,
    picture: String,
    email: String,
    cart: [
      {
        cartQuantity: Number,
        category: Array,
        size: Array,
        color: Array,
        rating: Array,
        inStock: Boolean,
        title: String,
        price: Number,
        description: String,
        image: String,
        createdAt: Date,
        updatedAt: Date,
      },
    ],
  })
);

app.get("/products", async (req, res) => {
  console.log("ord pro");
  let r = await Products.find({}).toArray();
  return res.send(r);
});
app.get("/products/:id", async (req, res) => {
  const productId = req.params.id;
  console.log("specific");
  try {
    const product = await Products.findOne({ _id: new ObjectId(productId) });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.send(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/user/addToCart", async (req, res) => {
  const { userId, products } = req.body;
  try {
    const user = await User.findOne({ _id: userId });

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }
    user.cart = [];
    user.cart = [...user.cart, ...products];
    await user.save();
    return res.send({ message: "Item Added Successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/auth/google-sign-in", async (req, res) => {
  const { token } = req.body;
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const { name, email, picture } = ticket.getPayload();
  User.findOne({ email }).then((user) => {
    if (user) {
      res.send(user);
    } else {
      User.create({ name, email, picture, cart: [] }).then((newUser) => {
        res.send(newUser);
      });
    }
  });
});

app.listen(PORT, () => {
  console.log(`LISTENING ON PORT ${PORT}`);
});
