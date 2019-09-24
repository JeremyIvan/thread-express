const express = require('express');
const bodyParser = require('body-parser')
const passport = require('passport')

const User = require('../models/users')
const authenticate = require('../authenticate')

let userRouter = express.Router();
userRouter.use(bodyParser.json())

userRouter.route('/signup')
.get((req, res, next) => {
  res.render('signupUser')
})
.post((req, res, next) => {
  User.register(new User({ username: req.body.username }), req.body.password, (err, user) => {
    if(err) {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.json({ err : err })
    }
    else {
      if (req.body.firstname){
        user.firstname = req.body.firstname
      }
      if (req.body.lastname){
        user.lastname = req.body.lastname
      }

      user.save((err, user) => {
        passport.authenticate('local')(req, res, () => {
          if (err){
            res.statusCode = 500
            res.setHeader("Content-Type", "application/json");
            res.json({err: err})
            return
          }
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json({success: true, status:"Registration Success"})
          res.redirect('/users/login')
        })
      })
    }
  })
})

userRouter.route("/login")
.get((req, res, next) => {
  res.render('loginUser')
})
.post(passport.authenticate('local'), (req, res) => {
  var token = authenticate.getToken({ _id: req.user._id })
  res.statusCode = 200;
  res.set({
    "Content-Type": "applicaiton/json",
  })
  
  res.set({
    "Authorization": "bearer " + token
  })
  // res.setHeader("Content-Type", "application/json");
  
  // res.json({success: true, token: token, status:"You are succesfully logged in"})
  res.redirect('/threads/listThreads')
});

module.exports = userRouter
