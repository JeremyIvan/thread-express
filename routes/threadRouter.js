const express = require('express')
const bodyParser = require('body-parser')
// const multer = require('multer')

const Threads = require('../models/threads')
const authenticate = require('../authenticate')

// const upload = multer({ dest: 'uploads/' })

const threadRouter = express.Router()

threadRouter.use(bodyParser.json())

threadRouter.route('/listThreads')
.get((req, res, next) => {
    Threads.find({})
    .then((threads) => {
        res.render('listThreads', { threads: threads })
        res.statusCode = 200
        res.setHeader('Content-type', 'application/json')
        res.json(threads)
    }, err => next(err))
    .catch(err => next(err))
})

threadRouter.route('/createThread')
.get(authenticate.verifyUser , (req, res, next) => {
    res.render('createThread')
})
.post((req, res, next) => {
    Threads.create(req.body)
    .then(thread => {
        if(req.body != null){
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.redirect('/threads/listThreads')
        }
        else {
            res.status(400).send('Entries must not be empty.')
            return
        }
    }, err => next(err))
    .catch(err => next(err))
})

threadRouter.route('/viewThread/:threadTitle')
.get((req, res, next) => {
    Threads.findOne({ "title" : req.params.threadTitle })
    .then(thread => {
        if( thread != null){
            res.render('viewThread', { threads: thread })
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.json(thread)
        }
        else {
            res.render('error.jade')
        }
    }, err => next(err))
    .catch(err => next(err))
})

threadRouter.route('/editThread/:threadTitle')
.get((req, res, next) => {
    Threads.findOne({ "title" : req.params.threadTitle})
    .then(thread => {
        res.render('editThread', { threads : thread })
        res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.json(thread)
    })
})
.post((req, res, next) => {
    Threads.findOneAndUpdate({ "title" : req.params.threadTitle }, {
        $set: req.body
    }, { new: true })
    .then(thread => {
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json')
        res.redirect('/threads/listThreads')
    }, err => next(err))
    .catch(err => next(err))
})

threadRouter.route('/deleteThread/:threadTitle')
.get((req, res, next) => {
    Threads.findOneAndRemove({ "title" : req.params.threadTitle })
    .then(thread => {
        if ( thread != null) {
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.redirect('/threads/listThreads')
        }
        else {
            res.render('error.jade')
        }
    }, err => next(err))
    .catch(err => next(err))
})

module.exports = threadRouter