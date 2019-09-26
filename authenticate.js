const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const JwtStrategy = require('passport-jwt').Strategy
const ExtractJwt = require('passport-jwt').ExtractJwt
const jwt = require('jsonwebtoken')

const config = require('./config')
const User = require('./models/users')

exports.LocalStrategy = passport.use(new LocalStrategy(User.authenticate()))
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

exports.getToken = function(user) {
    return jwt.sign(user, config.secretKey, { expiresIn: 3600 })
}

var opts = {}

var cookieExtractor = function(req) {
    var token = null;
    if (req && req.cookies)
    {
        token = req.cookies['authToken'];
    }
    return token;
};

opts.jwtFromRequest = cookieExtractor
opts.secretOrKey = config.secretKey

exports.jwtPassport = passport.use(new JwtStrategy(opts, 
    (jwt_payload, done) => {
        User.findOne({ _id: jwt_payload._id}, (err, user) => {
            if (err) {
                return done(err, false)
            }
            else if (user) {
                return done(null, user)
            }
            else {
                return done(null, false)
            }
        })
}))

exports.verifyUser = passport.authenticate('jwt', { session: false })