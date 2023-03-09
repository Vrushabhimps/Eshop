const express = require("express");
const bcryptjs = require("bcryptjs");
const Users = require("../Models/userModel");
const jasonwebtoken = require("jsonwebtoken");
const auth = require("../Helpers/auth");
const router = express.Router();
const path = require("path");
const cookieParser = require("cookie-parser");
router.use(cookieParser());
const mail = require("../controller/mail");
const multer = require("multer");
const forms = multer();
router.use(forms.array());

router.use(express.json());
router.use(express.urlencoded());

// get data
router.get("/", auth, async (req, res) => {
  const userList = await Users.aggregate([
    {
      $project: {
        name: 1,
        email: 1,
        Address: {
          $concat: [
            "$street",
            ",",
            "$apartment",
            ",",
            "$city",
            ",",
            "$country",
            "-",
            "$postalcode",
          ],
        },
        phone: 1,
      },
    },
  ]);
  if (!userList) {
    res.status(500).send("Users List not find ..........!");
  }
  res.status(200).send(userList);
});

router.post("/login", async (req, res) => {
  const user = await Users.findOne({ email: req.body.email });
  if (!user) {
    return res.status(400).send("The user not found");
  }
  if (user && bcryptjs.compareSync(req.body.password, user.password)) {
    const token = jasonwebtoken.sign(
      {
        email: user.email,
        isAdmin: user.isAdmin,
      },
      process.env.SECRET
    );
    res.cookie("jwt", token).send("Login Successful.......!");
  } else {
    res.status(400).send("Incorrect password......!");
  }
});

router.post("/register", async (req, res) => {
  try {
    const user = await Users.findOne({ email: req.body.email });
    if (user) throw res.send("This user already exist......!");

    let userDetails = new Users({
      name: req.body.name,
      email: req.body.email,
      password: bcryptjs.hashSync(req.body.password, 10),
      street: req.body.street,
      apartment: req.body.apartment,
      city: req.body.city,
      postalcode: req.body.postalcode,
      country: req.body.country,
      phone: req.body.phone,
      isAdmin: req.body.isAdmin,
    });

    userDetails = await userDetails.save();
    mail(req.body.email);

    res.status(200).send(`successful : ${userDetails}`);
  } catch {
    res.send("try again.....!");
  }
});

router.patch("/:id", auth, async (req, res) => {
  const user = await Users.findByIdAndUpdate(
    req.params.id,
    {
      email: req.body.email,
      password: bcryptjs.hashSync(req.body.password, 10),
      street: req.body.street,
      apartment: req.body.apartment,
      city: req.body.city,
      postalcode: req.body.postalcode,
      country: req.body.country,
      phone: req.body.phone,
    },
    { new: true }
  );
  if (!user) throw res.send("User Not update......!");
  res.send(`User updated...! \n ${user}`);
});

router.delete("/", auth, async (req, res) => {
  await Users.findByIdAndRemove(req.query.id)
    .then(() => {
      res.status(200).send("User is delete.......!");
    })
    .catch(() => {
      res.status(200).send("User is not delete.......!");
    });
});

router.get("/logout", (req, res) => {
  res.clearCookie("jwt").send("Logout Succesful.....!");
});
router.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../templates/404/404.html"));
});

module.exports = router;
