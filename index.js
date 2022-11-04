const { json } = require("express");
const express = require("express");
const mongoose = require("mongoose");
const {
  usermodel,
  idmodel,
  productmodel,
  adminmodel,
  pidmodel,
} = require("./Mongoconnection");
const cors = require("cors");
const PORT = 5000;
const jwt = require("jsonwebtoken");
const multer = require("multer");
const fs = require("fs");
const { send } = require("process");
const { tmpdir } = require("os");

require("dotenv").config();
const app = express();
app.use(express.json());
const secret = process.env.SECRET_KEY;
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage: storage });

// api for product data
app.post("/uploadproduct", upload.single("testImage"), async (req, res) => {
  const { name, description, price, rating, qauntity, details } = req.body;
  console.log("image saved to multer.....");

  console.log(req.body);
  let prid;
  // getting a product id
  await pidmodel.collection.find({}, async (err, result) => {
    if (result) {
      const arr = await result.toArray();
      prid = arr[0].pid;
      await pidmodel.collection.updateOne(
        {
          pid: arr[0].pid,
        },
        {
          $set: {
            pid: arr[0].pid + 1,
          },
        }
      );
    } else {
      console.log("No pid found");
    }
  });

  await productmodel.collection.insertOne(
    {
      name: name,
      description: description,
      details: details,
      price: price,
      rating: rating,
      qauntity: qauntity,
      productid: prid,
      img: {
        data: fs.readFileSync("uploads/" + req.file.filename),
        contentType: "image/jpg",
      },
    },
    (err, result) => {
      if (!err) {
        console.log("product Inserted successfully");
        res.send("success");
      } else {
        console.log(err);
      }
    }
  );
});

app.get("/", (req, res) => {
  console.log("Requested");
  res.send("Hello from project backend");
});

// creating new user
app.post("/createuser", async (req, res) => {
  const { name, userid, email, address, password } = req.body;

  console.log(name + userid + email + address + password);

  const result = await usermodel.collection.insertOne({
    name: name,
    email: email,
    address: address,
    userid: userid,
    password: password,
    admin: false,
    orders: [],
    cart: [],
  });
  if (result) {
    console.log(result);
    jwt.sign(
      {
        email: email,
        myid: userid,
        name: name,
        password: password,
      },
      secret,
      (err, token) => {
        if (token) {
          console.log(token);
          res.send({ token: token });
        } else {
          res.send(false);
        }
      }
    );
  }
});

// loging user
app.post("/userlogin", async (req, res) => {
  const { email, password } = req.body;

  await usermodel.collection.findOne(
    {
      email: email,
    },
    (err, user) => {
      if (user) {
        console.log("user found in database generating token.....");
        if (user.password == password) {
          jwt.sign(
            {
              email: user.email,
              myid: user.userid,
              name: user.name,
              password: user.password,
              admin: false,
            },
            secret,
            (err, token) => {
              if (token) {
                console.log(token);
                res.send(token);
              }
            }
          );
        } else {
          console.log(false);
          res.send(false);
        }
      } else {
        console.log("user not present");
        res.send(false);
      }
    }
  );
});

// get new userid

app.post("/getid", async (req, res) => {
  await idmodel.collection.find({}, async (err, data) => {
    if (data) {
      const re = await data.toArray();
      console.log(re[0].cid);
      console.log("id send");

      await idmodel.collection.updateOne(
        {
          cid: re[0].cid,
        },
        {
          $set: {
            cid: re[0].cid + 1,
          },
        },
        (err, result) => {
          if (result) {
            console.log("success");
            res.send({ id: re[0].cid + 1 });
          } else {
            res.send(false);
          }
        }
      );
    } else {
      res.send(false);
    }
  });
});

// verify token for middleware

app.post("/verifytoken", async (req, res) => {
  const token = req.body.token;
  jwt.verify(token, secret, (err, valid) => {
    if (valid) {
      if (valid.admin == true) {
        console.log("admin token");
        res.send({ admin: "true" });
      } else {
        res.send({ admin: "false" });
      }
    } else {
      res.send(false);
    }
  });
});

// admin login
app.post("/adminlogin", async (req, res) => {
  await adminmodel.collection.findOne(
    {
      adminid: req.body.adminid,
      password: req.body.password,
    },
    (err, result) => {
      if (result) {
        console.log(result);
        jwt.sign(
          {
            adminid: req.body.adminid,
            admin: true,
          },
          secret,
          (err, result2) => {
            if (result2) {
              console.log("Admin logged in...");
              res.send(result2);
            } else {
              res.send(false);
            }
          }
        );
      } else {
        res.send(false);
      }
    }
  );
});

// accessing products from the databse
app.post("/getproducts", async (req, res) => {
  await productmodel.collection.find({}, async (err, data) => {
    if (data) {
      const array = await data.toArray();
      res.send(array);
    } else {
      res.send(false);
    }
  });
});

// verify product for update
app.post("/verifyproduct", async (req, res) => {
  if (req.body.pid) {
    console.log(req.body.pid);
    await productmodel.collection.findOne(
      {
        productid: parseInt(req.body.pid),
      },
      (err, result) => {
        if (result) {
          res.send(result);
        } else {
          res.send(false);
        }
      }
    );
  }
});

// update product
app.post("/updateproduct", async (req, res) => {
  const { name, pid, details, description, price, rating, qauntity } = req.body;
  console.log(name + pid + details);
  await productmodel.collection.updateOne(
    {
      productid: parseInt(pid),
    },
    {
      $set: {
        name: name,
        details: details,
        description: description,
        rating: rating,
        price: price,
        qauntity: qauntity,
      },
    },
    (err, res2) => {
      if (res2) {
        res.send("Product Updated");
      } else {
        res.send("Product Not Updated");
      }
    }
  );
});

// delete product
app.post("/deleteproduct", async (req, res) => {
  if (req.body.id != null) {
    await productmodel.collection.deleteOne(
      {
        productid: req.body.id,
      },
      (err, result) => {
        if (result) {
          res.send(true);
        } else {
          res.send(false);
        }
      }
    );
  }
});

// all userlist
app.post("/getusers", async (req, res) => {
  const { token } = req.body;
  jwt.verify(token, secret, async (err, valid) => {
    if (valid) {
      console.log(valid.myid);
      console.log("user yes.");
      await usermodel.collection.find({}, async (err, result) => {
        if (result) {
          const fres = await result.toArray();
          console.log("all users send");
          res.send(fres);
        } else {
          console.log("all users no send");
          console.log("f1");
          res.send(false); 
        }
      });
    }
  });
});

// place oreder
app.post("/takeoreder", async (req, res) => {
  const { pid, token } = req.body;

  // verify token
  jwt.verify(token, secret, async (err, valid) => {
    if (valid) {
      if (valid.myid) {
        console.log(valid.myid);
        console.log("user yes.");
        // all code goes here
        // find user by userid
        await usermodel.collection.findOne(
          {
            userid: valid.myid,
          },
          async (err, result) => {
            if (result) {
              result.orders.push(pid);
              console.log(result.orders);
              // await usermodel
              if (result.orders.length > 0) {
                await usermodel.collection.updateOne(
                  {
                    userid: valid.myid,
                  },
                  {
                    $set: {
                      orders: result.orders,
                    },
                  },
                  (err, rt) => {
                    if (rt) {
                      console.log("oreder added success");
                      res.send(true);
                    } else {
                      console.log("Order Not placed");
                    }
                  }
                );
              } else {
                console.log("order array size is samller than 1");
              }
            }
          }
        );
      } else {
        res.send(false);
      }
    } else {
      res.send(false);
    }
  });
});

// get all orders for user
app.post("/getallorders", async (req, res) => {
  const { token } = req.body;
  if (req.body.token != null) {
    jwt.verify(token, secret, async (err, valid) => {
      if (valid) {
        if (valid.myid) {
          console.log(valid.myid);
          await usermodel.collection.findOne(
            {
              userid: valid.myid,
            },
            async (err, result) => {
              if (result) {
                // extract all data from user
                console.log(result.orders);

                if (result.orders.length > 0) {
                  await productmodel.collection.find({}, async (err, pr) => {
                    if (pr) {
                      const rs = await pr.toArray();

                      const orderdata = [];

                      for (i = 0; i < result.orders.length; i++) {
                        for (j = 0; j < rs.length; j++) {
                          if (result.orders[i] == rs[j].productid) {
                            orderdata.push(rs[j]);
                            break;
                          }
                        }
                      }
                      console.log(orderdata[0].name);
                      res.send(orderdata);
                    } else {
                      res.send(false);
                    }
                  });
                }
              } else {
                res.send(false);
              }
            }
          );
        } else {
          res.send(false);
        }
      } else {
        console.log("Token not valid");
        res.send(false);
      }
    });
  } else {
    console.log("Token Not Found");
    res.send(false);
  }
});

// add to cart
app.post("/addtocart", async (req, res) => {
  const { token, pid } = req.body;
  jwt.verify(token, secret, async (err, valid) => {
    if (valid) {
      if (valid.myid) {
        // console.log(valid.myid);
        await usermodel.collection.findOne(
          {
            userid: valid.myid,
          },
          async (err, result) => {
            if (result) {
              result.cart.push(pid);
              await usermodel.collection.updateOne(
                {
                  userid: valid.myid,
                },
                {
                  $set: {
                    cart: result.cart,
                  },
                },
                (er, rs) => {
                  if (rs) {
                    console.log("product addedd to cart");
                    res.send(true);
                  } else {
                    res.send(false);
                  }
                }
              );
            } else {
              console.log("token not valid");
              res.send(false);
            }
          }
        );
      } else {
        res.send(false);
      }
    } else {
      res.send(false);
    }
  });
});

// access cart products
app.post("/getcartitem", async (req, res) => {
  const { token } = req.body;
  if (req.body.token != null) {
    jwt.verify(token, secret, async (err, valid) => {
      if (valid) {
        if (valid.myid) {
          console.log(valid.myid);
          await usermodel.collection.findOne(
            {
              userid: valid.myid,
            },
            async (err, result) => {
              if (result) {
                // extract all data from user
                console.log(result.cart);

                if (result.cart.length > 0) {
                  await productmodel.collection.find({}, async (err, pr) => {
                    if (pr) {
                      const rs = await pr.toArray();

                      const cartdata = [];

                      for (i = 0; i < result.cart.length; i++) {
                        for (j = 0; j < rs.length; j++) {
                          if (result.cart[i] == rs[j].productid) {
                            cartdata.push(rs[j]);
                            break;
                          }
                        }
                      }
                      console.log(cartdata[0].name);
                      res.send(cartdata);
                    } else {
                      res.send(false);
                    }
                  });
                }
              } else {
                res.send([]);
              }
            }
          );
        } else {
          res.send(false);
        }
      } else {
        console.log("Token not valid");
        res.send(false);
      }
    });
  } else {
    console.log("Token Not Found");
    res.send(false);
  }
});

// sent cart item number
app.post("/getcartno", async (req, res) => {
  const { token } = req.body;
  if (req.body.token != null) {
    jwt.verify(token, secret, async (err, valid) => {
      if (valid) {
        if (valid.myid) {
          console.log(valid.myid);
          await usermodel.collection.findOne(
            {
              userid: valid.myid,
            },
            async (err, result) => {
              if (result) {
                // extract all data from user
                console.log(result.cart);
                res.send({ no: result.cart.length });
              } else {
                res.send(false);
              }
            }
          );
        }
      }
    });
  }
});

// cancel order
app.post("/cancelorderandcartitem", (req, res) => {
  const { token, condition, pid } = req.body;
  if (req.body.token != null) {
    jwt.verify(token, secret, async (err, valid) => {
      if (valid) {
        if (valid.myid) {
          console.log(valid.myid);
          if (condition) {
            // cancel order
            await usermodel.collection.findOne(
              {
                userid: valid.myid,
              },
              async (err, result) => {
                if (result) {
                  // extract all data from user
                  const orderarr = [];
                  let tmp;
                  for (i = 0; i < result.orders.length; i++) {
                    if (result.orders[i] == pid) {
                      // orderarr.push(result.orders[i]);
                      tmp = i;
                    }
                  }
                  console.log(tmp)
                  for (i = 0; i < result.orders.length; i++) {
                    if (i != tmp) {
                      orderarr.push(result.orders[i]);
                    } else {
                    }
                  }
                  console.log(orderarr);
                  await usermodel.collection.updateOne(
                    {
                      userid: valid.myid,
                    },
                    {
                      $set: {
                        orders: orderarr,
                      },
                    },
                    (err, nx) => {
                      if (nx) {
                        console.log("Removed Order");
                        res.send(true);
                      } else {
                        res.send(false);
                      }
                    }
                  );
                }
              }
            );
          } else {
            // remove from cart
            console.log("hhhh");
            await usermodel.collection.findOne(
              {
                userid: valid.myid,
              },
              async (err, result) => {
                if (result) {
                  // extract all data from user
                  const cartarr = [];
                  let tmpdir;
                  for (i = 0; i < result.cart.length; i++) {
                    if (result.cart[i] != pid) {
                    } else {
                      tmpdir = i;
                      break;
                    }
                  }
                  for (i = 0; i < result.cart.length; i++) {
                    if (i != tmpdir) {
                      cartarr.push(result.cart[i]);
                    } else {
                    }
                  }
                  console.log(cartarr);
                  await usermodel.collection.updateOne(
                    {
                      userid: valid.myid,
                    },
                    {
                      $set: {
                        cart: cartarr,
                      },
                    },
                    (err, nx) => {
                      if (nx) {
                        console.log("Removed Order");
                        res.send(true);
                      } else {
                        res.send(false);
                      }
                    }
                  );
                }
              }
            );
          }
        }
      }
    });
  }
});

app.listen(PORT, (res) => {
  console.log("Your App Is Listening On Port: " + PORT);
});
