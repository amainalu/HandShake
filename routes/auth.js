const router = require("express").Router();

// ? Package to will handle encryption of password
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

// How many rounds should bcrypt run the salt (default [10 - 12 rounds])
const saltRounds = 10;

// Requiring the User model in order to interact with the database
const Company = require("../models/Company.model");
const Freelancer = require("../models/Freelancer.model");

// Requiring necessary middlewares in order to control access to specific routes
const shouldNotBeLoggedIn = require("../middlewares/shouldNotBeLoggedIn");
const isLoggedIn = require("../middlewares/isLoggedIn");

// get and post routes for company signup

router.get("/company/signup", shouldNotBeLoggedIn, (req, res) => {
  res.render("auth/company/signup");
});

router.post("/company/signup", shouldNotBeLoggedIn, (req, res) => {
  const {
    username,
    password,
    email,
    location,
    businessSector,
    description,
    address,
    contact,
  } = req.body;

  if (!username || !email || !location || !contact) {
    return res.status(400).render("auth/company/signup", {
      errorMessage: "Please provide requiered fields",
    });
  }
  if (password.length < 8) {
    return res.status(400).render("auth/company/signup", {
      errorMessage: "Your password needs to be at least 8 characters",
    });
  }
  Company.findOne({ username }).then((found) => {
    if (found) {
      return res.status(400).render("auth/company/signup", {
        errorMessage: "Username already taken",
      });
    }
    return bcrypt
      .genSalt(saltRounds)
      .then((salt) => bcrypt.hash(password, salt))
      .then((hashedPassword) => {
        return Company.create({
          username,
          password: hashedPassword,
          email,
          location,
          businessSector,
          description,
          address,
          contact,
        });
      })
      .then((company) => {
        // binds the user to the session object
        req.session.company = company;
        res.redirect("/");
      })
      .catch((error) => {
        if (error instanceof mongoose.Error.ValidationError) {
          return res
            .status(400)
            .render("auth/company/signup", { errorMessage: error.message });
        }
        if (error.code === 11000) {
          return res.status(400).render("auth/company/signup", {
            errorMessage:
              "Username need to be unique. THe username you chose is already in used.",
          });
        }
        return res
          .status(500)
          .render("auth/company/signup", { errorMessage: error.message });
      });
  });
});

// freelancer get and post signup routes

router.get("/freelancer/signup", shouldNotBeLoggedIn, (req, res) => {
  res.render("auth/freelancer/signup");
});

router.post("/freelancer/signup", shouldNotBeLoggedIn, (req, res) => {
  const {
    username,
    password,
    email,
    location,
    description,
    skills,
    contact,
  } = req.body;

  if (!username || !email || !location || !skills || !contact) {
    return res.status(400).render("auth/freelancer/signup", {
      errorMessage: "Please provide requiered fields",
    });
  }
  if (password.length < 8) {
    return res.status(400).render("auth/freelancer/signup", {
      errorMessage: "Your password needs to be at least 8 characters",
    });
  }
  Freelancer.findOne({ username }).then((found) => {
    if (found) {
      return res.status(400).render("auth/freelancer/signup", {
        errorMessage: "Username already taken",
      });
    }
    return bcrypt
      .genSalt(saltRounds)
      .then((salt) => bcrypt.hash(password, salt))
      .then((hashedPassword) => {
        return Freelancer.create({
          username,
          password: hashedPassword,
          email,
          location,
          description,
          skills,
          contact,
        });
      })
      .then((freelancer) => {
        // binds the user to the session object
        req.session.freelancer = freelancer;
        console.log(freelancer);
        res.redirect("/");
      })
      .catch((error) => {
        if (error instanceof mongoose.Error.ValidationError) {
          return res
            .status(400)
            .render("freelancer/signup", { errorMessage: error.message });
        }
        if (error.code === 11000) {
          return res.status(400).render("freelancer/signup", {
            errorMessage:
              "Username need to be unique. THe username you chose is already in used.",
          });
        }
        return res
          .status(500)
          .render("freelancer/signup", { errorMessage: error.message });
      });
  });
});

// end of signup of company and freelancer

router.get("/login", shouldNotBeLoggedIn, (req, res) => {
  res.render("auth/login");
});

router.post("/login", shouldNotBeLoggedIn, (req, res) => {
  const { username, password } = req.body;

  if (!username) {
    return res
      .status(400)
      .render("login", { errorMessage: "Please provide your username" });
  }

  //   * Here we use the same logic as above - either length based parameters or we check the strength of a password
  if (password.length < 8) {
    return res.status(400).render("login", {
      errorMessage: "Your password needs to be at least 8 characters",
    });
  }

  User.findOne({ username })
    .then((user) => {
      if (!user) {
        return res
          .status(400)
          .render("login", { errorMessage: "Wrong credentials" });
      }

      bcrypt
        .compare(password, user.password)

        .then((isSamePassword) => {
          if (!isSamePassword) {
            return res
              .status(400)
              .render("login", { errorMessage: "Wrong credentials" });
          }
          req.session.user = user;
          // req.session.user = user._id ! better and safer but in this case we saving the entire user object
          return res.redirect("/");
        });
    })
    .catch((err) => {
      console.log(err);
      // in this case we are sending the error handling to the error handling middleware that is defined in the error handling file
      // you can just as easily run the res.status that is commented out below
      next(err);
      // return res.status(500).render("login", { errorMessage: err.message });
    });
});

router.get("/logout", isLoggedIn, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res
        .status(500)
        .render("auth/logout", { errorMessage: err.message });
    }
    res.redirect("/");
  });
});

module.exports = router;
