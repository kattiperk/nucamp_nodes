const express = require('express');
const User = require('../models/user');

const router = express.Router();
const passport = require('passport');

const authenticate = require('../authenticate');

const cors = require('./cors');

/* GET users listing. */

router
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
.get('/', cors.corsWithOptions, (req, res, next) => {
    User.find()
        // .then(users => {
        //     res.statusCode = 200;
        //     res.setHeader('Content-Type', 'application/json');
        //     res.json(users);
        // })
        .then(users => res.status(200).json(users))
        .catch(err => next(err));
});

router
.post('/signup', cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res) => {
  const user = new User({ username: req.body.username });

  User.register(user, req.body.password)
      .then(registeredUser => {
          if (req.body.firstname) {
              registeredUser.firstname = req.body.firstname;
          }
          if (req.body.lastname) {
              registeredUser.lastname = req.body.lastname;
          }
          return registeredUser.save();
      })
      .then(() => {
          passport.authenticate('local')(req, res, () => {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.json({ success: true, status: 'Registration Successful!' });
          });
      })
      .catch(err => {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.json({ err: err });
      });
});

router
.post('/login', cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res) => {
    if(!req.session.user) {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            const err = new Error('You are not authenticated!');
            res.setHeader('WWW-Authenticate', 'Basic');
            err.status = 401;
            return next(err);
        }

        const auth = Buffer.from(authHeader.split(' ')[1], 'base64').toString().split(':');
        const username = auth[0];
        const password = auth[1];

        User.findOne({username: username})
        .then(user => {
            if (!user) {
                const err = new Error(`User ${username} does not exist!`);
                err.status = 401;
                return next(err);
            } else if (user.password !== password) {
                const err = new Error('Your password is incorrect!');
                err.status = 401;
                return next(err);
            } else if (user.username === username && user.password === password) {
                req.session.user = 'authenticated';
                res.statusCode = 200;
                res.setHeader('Content-Type', 'text/plain');
                res.end('You are authenticated!')
            }
        })
        .catch(err => next(err));
    } else {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain');
        res.end('You are already authenticated!');
    }
});

router
.get('/logout', cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res) => {
    if (req.session) {
        req.session.destroy();
        res.clearCookie('session-id');
        res.redirect('/');
    } else {
        const err = new Error('You are not logged in!');
        err.status = 401;
        return next(err);
    }
});

router
.post('/signup', cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res) => {
  User.register(
      new User({username: req.body.username}),
      req.body.password,
      err => {
          if (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.json({err: err});
          } else {
              passport.authenticate('local')(req, res, () => {
                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json');
                  res.json({success: true, status: 'Registration Successful!'});
              });
          }
      }
  );
});

router.post('/login', cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.json({success: true, status: 'You are successfully logged in!'});
});

router.post('/login', cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res) => {
  const token = authenticate.getToken({_id: req.user._id});
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.json({success: true, token: token, status: 'You are successfully logged in!'});
});


module.exports = router;