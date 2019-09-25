const express = require('express')
const bodyParser = require('body-parser')

const Threads = require('../models/threads')
const authenticate = require('../authenticate')

const threadRouter = express.Router()

threadRouter.use(bodyParser.json())

threadRouter.route('/listThreads')
.get((req, res, next) => {
    Threads.find({})
    .then((threads) => {
        res.render('listThreads', { threads: threads })
        res.statusCode = 200
        // res.setHeader('Content-type', 'application/json')
        res.json(threads)
    }, err => next(err))
    .catch(err => next(err))
})

threadRouter.route('/createThread')
.get((req, res, next) => {
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

threadRouter.route('/delete')
.delete((req, res, next) => {
    Threads.remove({})
    .then((resp)=>{
        res.statusCode=200;
        res.setHeader("Content-Type", "application/json");
        res.json(resp);
    }, (err)=>next(err))
    .catch((err)=>next(err));
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
                // console.log(req.body.comment)
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