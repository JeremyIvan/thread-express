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
  res.setHeader("Content-Type", "application/json");
  res.cookie('authToken', token.replace(/['"]+/g, ''))
  res.redirect('/threads/listThreads')
});

userRouter.route("/logout")
.get(authenticate.verifyUser, (req, res, next)=>{
  if (req.cookies) {
    res.clearCookie('authToken')
    res.redirect('/')
  }
  else {
      var err = new Error('You are not logged in!')
      err.status = 403
      return next(err)
  }
});

module.exports = userRouter
