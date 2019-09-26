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
.get(authenticate.verifyUser, (req, res, next) => {
    Threads.find({})
    .populate('author')
    .populate('comments.author')
    .then(threads => {
        res.render('listThreads', { threads: threads, user_id : req.user._id })
        res.statusCode = 200
    }, err => next(err))
    .catch(err => next(err))
})

threadRouter.route('/createThread')
.get(authenticate.verifyUser, (req, res, next) => {
    res.render('createThread')
})
.post(authenticate.verifyUser, upload.single('image'), (req, res, next) => {
    if(req.file !== undefined) {
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
    }
    else{ 
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
    }
})

threadRouter.route('/viewThread/:threadId')
.get(authenticate.verifyUser, (req, res, next) => {
    Threads.findById(req.params.threadId)
    .populate('comments.author')
    .populate('author')
    .then(thread => {
        if( thread != null){
            res.render('viewThread', { threads: thread, user_id : req.user._id })
            res.statusCode = 200
        }
        else {
            res.render('error.jade')
        }
    }, err => next(err))
    .catch(err => next(err))
})

threadRouter.route('/editThread/:threadId')
.get(authenticate.verifyUser, (req, res, next) => {
    Threads.findById(req.params.threadId)
    .then(thread => {
        if(thread.author._id.equals(req.user._id)){
            Threads.findById(req.params.threadId)
            .then(thread => {
                res.render('editThread', { threads : thread })
                res.statusCode = 200
            })
        }
        else {
            return next(new Error("You are not authorized to modify thread"))
        }
    })
})
.post(authenticate.verifyUser, (req, res, next) => {
    Threads.findById(req.params.threadId)
    .then(thread => {
        if(thread.author._id.equals(req.user._id)){
            Threads.findByIdAndUpdate(req.params.threadId, {
                $set: req.body
            }, { new: true })
            .then(thread => {
                res.statusCode = 200
                res.redirect('/threads/listThreads')
            }, err => next(err))
            .catch(err => next(err))
        }
        else {
            return next(new Error("You are not authorized to modify thread"))
        }
    })
})

threadRouter.route('/deleteThread/:threadId')
.get(authenticate.verifyUser, (req, res, next) => {
    Threads.findById(req.params.threadId)
    .then(thread => {
        if(thread.author._id.equals(req.user._id)){
            Threads.findByIdAndRemove(req.params.threadId)
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
        }
        else {
            return next(new Error("You are not authorized to delete thread"))
        }
    })
})

threadRouter.route('/viewThread/:threadId/postComment')
.post(authenticate.verifyUser, (req, res, next) => {
    Threads.findById(req.params.threadId)
    .then(thread => {
        if(thread != null) {
            req.body.author = req.user._id
            thread.comments.push(req.body)
            thread.save()
            .then(thread => {
                Threads.findById(req.params.threadId)
                .populate('comments.author')
                .then(thread => {
                    res.statusCode = 200
                    res.setHeader('Content-Type', 'application/json')
                    res.redirect('/threads/viewThread/' + req.params.threadId)
                })
            }, err => { next(err) })
        }
        else {
            err = new Error('Thread ' + req.params.threadId + ' not found')
            err.status = 404
            return next(err)
        }
    }, (err) => next(err))
    .catch((err) => next(err))
})

threadRouter.route('/viewThread/:threadId/deleteComment/:commentId')
.get(authenticate.verifyUser, (req, res, next) => {
    Threads.findById(req.params.threadId)
    .then(thread => {
        if(thread != null && thread.comments.id(req.params.commentId) != null){
            if(thread.comments.id(req.params.commentId).author._id.equals(req.user._id)){
                Threads.findById(req.params.threadId)
                .then(thread => {
                    if(thread != null && thread.comments.id(req.params.commentId) != null){
                        thread.comments.id(req.params.commentId).remove()
                        thread.save()
                        .then(thread => {
                            res.statusCode = 200
                            res.setHeader('Content-Type', 'application/json')
                            res.redirect('/threads/viewThread/' + req.params.threadId)
                        }, err => next(err))
                    }
                    else if (thread == null){
                        err = new Error('Thread ' + req.params.threadId + " not found")
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
            }
            else {
                return next(new Error("You are not authorized to delete comment"))
            }
        }
        else if (thread == null){
            err = new Error('Thread ' + req.params.threadId + " not found")
            err.status = 404
            return next(err)
        }
        else {
            err = new Error('Comment ' + req.params.commentId + " not found")
            err.status = 404
            return next(err)
        }
    })
})

threadRouter.route('/viewThread/:threadId/editComment/:commentId')
.get(authenticate.verifyUser, (req, res, next) => {
    Threads.findById(req.params.threadId)
    .then(thread => {
        if(thread != null && thread.comments.id(req.params.commentId) != null){
            if(thread.comments.id(req.params.commentId).author._id.equals(req.user._id)){
                Threads.findById(req.params.threadId)
                .then(thread => {
                    if(thread != null && thread.comments.id(req.params.commentId) != null){
                        if(thread.comments.id(req.params.commentId).author._id.equals(req.user._id)){
                            Threads.findById(req.params.threadId)
                            .then(thread => {
                                res.render('editComment', {threads : thread.comments.id(req.params.commentId)})
                                res.statusCode = 200
                            })
                        }
                        else {
                            return next(new Error("You are not authorized to delete comment"))
                        }
                    }
                    else if (thread == null){
                        err = new Error('Thread ' + req.params.threadId + " not found")
                        err.status = 404
                        return next(err)
                    }
                    else {
                        err = new Error('Comment ' + req.params.commentId + " not found")
                        err.status = 404
                        return next(err)
                    }
                })
            }
            else {
                return next(new Error("You are not authorized to modify comment"))
            }
        }
        else if (thread == null){
            err = new Error('Thread ' + req.params.threadId + " not found")
            err.status = 404
            return next(err)
        }
        else {
            err = new Error('Comment ' + req.params.commentId + " not found")
            err.status = 404
            return next(err)
        }
    })
})
.post(authenticate.verifyUser, (req, res, next) => {
    Threads.findById(req.params.threadId)
    .then(thread => {
        if(thread != null && thread.comments.id(req.params.commentId) != null){
            if(thread.comments.id(req.params.commentId).author._id.equals(req.user._id)){
                Threads.findById(req.params.threadId)
                .then(thread => {
                    if(thread != null && thread.comments.id(req.params.commentId) != null) {
                        if(req.body.comment) {
                            thread.comments.id(req.params.commentId).comment = req.body.comment 
                        }
                        thread.save()
                        .then(thread => {
                            res.statusCode = 200
                            res.setHeader('Content-Type', 'application/json')
                            res.redirect('/threads/viewThread/' + req.params.threadId)
                        }, err => next(err))
                    }
                    else if (thread == null) {
                        err = new Error('Thread ' + req.params.threadId + ' not found')
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
            }
            else {
                return next(new Error("You are not authorized to modify comment"))
            }
        }
        else if (thread == null){
            err = new Error('Thread ' + req.params.threadId + " not found")
            err.status = 404
            return next(err)
        }
        else {
            err = new Error('Comment ' + req.params.commentId + " not found")
            err.status = 404
            return next(err)
        }
    })    
})

module.exports = threadRouter