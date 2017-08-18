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
    Post.find({ soID: post.acceptedAnswerID })
    .exec((error, answer) => {
      if (!answer) {
        res.status(STATUS_USER_ERROR);
        res.json({ error: 'No accepted answer was found.' });
        return;
      }
      res.status(STATUS_OK);
      res.json(answer[0]);
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
    Post.find({ parentID: soID })
    .sort({ score: -1 })
    .exec((error, answer) => {
      if (!answer) {
        sendUserError(error, res);
        return;
      }
      console.log(answer);
      res.status(STATUS_OK);
      res.json(answer[0]);
    });
  });
});

module.exports = { server };
