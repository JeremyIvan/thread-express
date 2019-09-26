const express = require('express')
const bodyParser = require('body-parser')
const multer = require('multer')

const Threads = require('../models/threads')
const authenticate = require('../authenticate')

const storage = multer.diskStorage({
    destination : (req, file, cb) => {
        cb(null, 'public/images')
    },
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
    console.log(req.body.author)
    Threads.find({})
    .populate('author')
    .populate('comments.author')
    .then(threads => {
        res.render('listThreads', { threads: threads })
        res.statusCode = 200
    }, err => next(err))
    .catch(err => next(err))
})

threadRouter.route('/createThread')
.get(authenticate.verifyUser, (req, res, next) => {
    res.render('createThread.ejs')
})
.post(authenticate.verifyUser, upload.single('image'), (req, res, next) => {
    req.body.image = req.file.filename
    req.body.author = req.user._id
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
    .populate('comments.author')
    .populate('author')
    .then(thread => {
        if( thread != null){
            res.render('viewThread', { threads: thread })
            res.statusCode = 200
        }
        else {
            res.render('error.jade')
        }
    }, err => next(err))
    .catch(err => next(err))
})

threadRouter.route('/editThread/:threadTitle')
.get(authenticate.verifyUser, (req, res, next) => {
    Threads.findOne({ "title" : req.params.threadTitle})
    .then(thread => {
        res.render('editThread', { threads : thread })
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json')
        res.json(thread)
    })
})
.post(authenticate.verifyUser, (req, res, next) => {
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
.get(authenticate.verifyUser, (req, res, next) => {
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
.post(authenticate.verifyUser, (req, res, next) => {
    Threads.findOne({ "title" : req.params.threadTitle })
    .then(thread => {
        if(thread != null) {
            req.body.author = req.user._id
            thread.comments.push(req.body)
            thread.save()
            .then(thread => {
                Threads.findOne({ 'title' : req.params.threadTitle })
                .populate('comments.author')
                .then(thread => {
                    res.statusCode = 200
                    res.setHeader('Content-Type', 'application/json')
                    res.redirect('/threads/viewThread/'+req.params.threadTitle)
                })
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
.get(authenticate.verifyUser, (req, res, next) => {
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
.get(authenticate.verifyUser, (req, res, next) => {
    Threads.findOne({ "title" : req.params.threadTitle})
    .then(thread => {
        res.render('editComment', {threads : thread.comments.id(req.params.commentId)})
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json')
        res.json(thread.comments.id(req.params.commentId))
    })
})
.post(authenticate.verifyUser, (req, res, next) => {
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