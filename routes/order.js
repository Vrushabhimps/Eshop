const mongoose = require("mongoose");
const express = require("express");
const router = express.Router();
const Orders = require("../Models/orderModel");
const Orderitem = require("../Models/orderitemsModel");
const users = require("../Models/userModel");
const Products = require("../Models/productModel");
router.use(express.json());
router.use(express.urlencoded());
const cookieParser = require("cookie-parser");
const auth = require("../Helpers/auth");
router.use(cookieParser());

router.get("/", auth, async (req, res) => {
  const orderList = await Orders.aggregate([
    {
      $project: {
        Address: {
          $concat: [
            "$shippingAddress1",
            "$shippingAddress2",
            "$city",
            "$country",
            "$postalcode",
          ],
        },
        status: 1,
        phone: 1,
        totalPrice: 1,
        user: 1,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "userDetail",
        pipeline: [
          {
            $project: {
              name: 1,
            },
          },
        ],
      },
    },
  ]);
  if (orderList.length == 0) throw res.send("OrderList is empty....!");
  else res.send(orderList);
});

router.post("/", auth, async (req, res) => {
  const orderItemsIds = await Promise.all(
    req.body.orderitems.map(async (orderitem) => {
      let newOrderItem = new Orderitem({
        quantity: orderitem.quantity,
        product: orderitem.product,
        user: req.body.user,
      });
      newOrderItem = await newOrderItem.save();
      return newOrderItem._id;
    })
  );

  let totalprice = await Promise.all(
    req.body.orderitems.map(async (ele) => {
      console.log(ele.product);

      let result = await Products.findOne({ id: ele.product });
      return result.price * ele.quantity;
    })
  );

  let order = new Orders({
    orderItems: orderItemsIds,
    shippingAddress1: req.body.shippingAddress1,
    shippingAddress2: req.body.shippingAddress2,
    city: req.body.city,
    postalcode: req.body.postalcode,
    country: req.body.country,
    phone: req.body.phone,
    status: req.body.status,
    totalPrice: totalprice.reduce((a, b) => {
      a + b;
    }),
    user: req.body.user,
  });
  order = await order.save();
  if (!order) return res.status(400).send("the order cannot be created!");

  req.body.orderitems.forEach(async (ele) => {
    await Products.findByIdAndUpdate(ele.product, {
      $inc: { countInStock: -ele.quantity },
    });
  });
  res.status(200).send(order);
});

// Update Data
router.patch("/:id", auth, async (req, res) => {
  const order = await Orders.findByIdAndUpdate(
    req.params.id,
    {
      orderiterms: req.body.orderiterms,
      shippingAddress1: req.body.shippingAddress1,
      shippingAddress2: req.body.shippingAddress2,
      city: req.body.city,
      postalcode: req.body.postalcode,
      country: req.body.country,
      phone: req.body.phone,
      status: req.body.status,
      totalPrice: req.body.totalPrice,
    },
    { new: true }
  );
  if (!order) return res.status(500).send("The Order cannot be Update.....!");
  res.send(order);
});

// Delete Data
router.delete("/", auth, async (req, res) => {
  const order = await Orders.findByIdAndRemove(req.query.id);

  if (!order) return res.status(500).send("The Order cannot be deleted.....!");
  res.send({ massage: "The Order is deleted" });
});

router.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../templates/404/404.html"));
});
module.exports = router;
