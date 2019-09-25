const express = require('express')
const bodyParser = require('body-parser')
const multer = require('multer')

const Threads = require('../models/threads')
const authenticate = require('../authenticate')

const storage = multer.diskStorage({
    destination : (req, file, cb) => {
        cb(null, 'public/images')
    },

    filename : (req, file, cb) => {
        cb(null, file.originalname)
    }
})

const imageFileFilter = (req, file, cb) => {
    if( !file.originalname.match(/\.(jpg|jpeg|png|gif)$/)){
        return cb(new Error('You can upload only image files!'), false)
    }
    cb(null, true)
}

const upload = multer({ storage : storage , fileFilter : imageFileFilter })

const threadRouter = express.Router()

threadRouter.use(bodyParser.json())

threadRouter.route('/listThreads')
.get((req, res, next) => {
    
    res.setHeader('Content-type', 'application/json')
    res.setHeader('Authorization', req.cookies.authToken)

    Threads.find({})
    .then(threads => {
        res.render('listThreads', { threads: threads })
        res.statusCode = 200
    }, err => next(err))
    .catch(err => next(err))
})

threadRouter.route('/createThread')
.get((req, res, next) => {
    res.render('createThread')
})
.post(upload.single('image'), (req, res, next) => {
    console.log(req.body.image)
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

threadRouter.route('/viewThread/:threadTitle/postComment')
.post((req, res, next) => {
    Threads.findOne({ "title" : req.params.threadTitle })
    .then(thread => {
        if(thread != null) {
            thread.comments.push(req.body)
            thread.save()
            .then(thread => {
                res.statusCode = 200
                res.setHeader('Content-Type', 'application/json')
                res.redirect('/threads/viewThread/'+req.params.threadTitle)         
            }, err => { next(err) })
        }
        else {
            err = new Error('Thread ' + req.params.threadTitle + ' not found')
            err.status = 404
            return next(err)
        }
    }, (err) => next(err))
    .catch((err) => next(err))
})

threadRouter.route('/viewThread/:threadTitle/deleteComment/:commentId')
.get((req, res, next) => {
    Threads.findOne( { "title" : req.params.threadTitle })
    .then(thread => {
        if(thread != null && thread.comments.id(req.params.commentId) != null){
            thread.comments.id(req.params.commentId).remove()
            thread.save()
            .then(thread => {
                res.statusCode = 200
                res.setHeader('Content-Type', 'application/json')
                res.redirect('/threads/viewThread/' + req.params.threadTitle)
            }, err => next(err))
        }
        else if (thread == null){
            err = new Error('Thread ' + req.params.threadTitle + " not found")
            err.status = 404
            return next(err)
        }
        else {
            err = new Error('Comment ' + req.params.commentId + " not found")
            err.status = 404
            return next(err)
        }
    }, err => next(err))
    .catch(err => next(err))
})

threadRouter.route('/viewThread/:threadTitle/editComment/:commentId')
.get((req, res, next) => {
    Threads.findOne({ "title" : req.params.threadTitle})
    .then(thread => {
        res.render('editComment', {threads : thread.comments.id(req.params.commentId)})
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json')
        res.json(thread.comments.id(req.params.commentId))
    })
})
.post((req, res, next) => {
    Threads.findOne({ "title" : req.params.threadTitle })
    .then(thread => {
        if(thread != null && thread.comments.id(req.params.commentId) != null) {
            if(req.body.comment) {
                thread.comments.id(req.params.commentId).comment = req.body.comment 
            }
            thread.save()
            .then(thread => {
                res.statusCode = 200
                res.setHeader('Content-Type', 'application/json')
                res.redirect('/threads/viewThread/' + req.params.threadTitle)
            }, err => next(err))
        }
        else if (thread == null) {
            err = new Error('Thread ' + req.params.threadTitle + ' not found')
            err.status = 404
            return next(err)
        }
        else {
            err = new Error('Comment ' + req.params.commentId + ' not found')
            err.status = 404
            return next(err)
        }
    }, err => next(err))
    .catch(err => next(err))
})

module.exports = threadRouter