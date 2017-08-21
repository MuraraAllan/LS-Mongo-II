const bodyParser = require('body-parser');
const express = require('express');
const Post = require('./post');

const STATUS_OK = 200;
const STATUS_NOT_FOUND = 404;
const STATUS_USER_ERROR = 422;
const STATUS_SERVER_ERROR = 500;

const server = express();
// to enable parsing of json bodies for post requests
server.use(bodyParser.json());

const sendUserError = (err, res) => {
  res.status(STATUS_USER_ERROR);
  res.json(err);
};

server.get('/accepted-answer/:soID', (req, res) => {
  const { soID } = req.params;
  Post.findOne({ soID })
  .exec((err, post) => {
    if (!post) {
      res.status(STATUS_USER_ERROR);
      res.json({ error: 'No post found with that ID' });
      return;
    } else if (!post.acceptedAnswerID) {
      res.status(STATUS_USER_ERROR);
      res.json({ error: 'No accepted answer found with that ID' });
      return;
    }
    Post.findOne({ soID: post.acceptedAnswerID })
    .exec((error, answer) => {
      if (!answer) {
        res.status(STATUS_USER_ERROR);
        res.json({ error: 'No accepted answer was found.' });
        return;
      }
      res.status(STATUS_OK);
      res.json(answer);
    });
  });
});

server.get('/top-answer/:soID', (req, res) => {
  const { soID } = req.params;
  Post.findOne({ soID })
  .exec((err, post) => {
    if (!post) {
      sendUserError(err, res);
      return;
    }
    if (!post.acceptedAnswerID) {
      sendUserError(err, res);
      return;
    }
    Post.findOne({ parentID: soID, soID: { $ne: post.acceptedAnswerID } })
    .sort({ score: -1 })
    .exec((error, answer) => {
      if (!answer) {
        sendUserError(error, res);
        return;
      }
      res.status(STATUS_OK);
      res.json(answer);
    });
  });
});

server.get('/popular-jquery-questions', (req, res) => {
  res.status(STATUS_OK);
  Post.find({ $and: [{ parentID: null }, { tags: { $all: ['jquery'] } }, { $or: [{ 'user.reputation': { $gt: 200000 } }, { score: { $gt: 5000 } }] }] })
  .exec((err, post) => {
    res.status(STATUS_OK);
    res.json(post);
  });
});

server.get('/npm-answers', (req, res) => {
  Post.find({ tags: { $all: ['npm'] } })
  .exec((err, post) => {
    if (!post) {
      res.status(STATUS_USER_ERROR);
      res.json(err);
      return;
    }
    Post.find({ parentID: post.map(p => p.soID) })
    .exec((error, answer) => {
      res.json(answer);
    });
  });
});

module.exports = { server };
