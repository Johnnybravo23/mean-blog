const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const keys = require('../config/keys');
const passport = require('passport');

// load input validation
const validateRegisterInput = require('../validation/register');
const validateLoginInput = require('../validation/login');
// loading the user model
const User = require('../models/User');


router.get('/test', (req, res) => res.json({
  msg: 'Users Works'
}));

// @route POST authentication/register
// Register user
// Public
router.post('/register', (req, res) => {
  const { errors, isValid}  = validateRegisterInput(req.body);

  // Check validation
  if(!isValid) {
    return res.status(400).json(errors)
  }
    
  User.findOne({
    email: req.body.email
  })
  .then(user => {
    // checking for the user
    if(user) {
      errors.email = 'Email already exists';
      return res.status(400).json(errors);
    } else {

      const avatar = gravatar.url(req.body.email, {
        s: '200',
        r: 'pg',
        d: 'mm'
      });

      // creating a new user
      const newUser = new User({
        username: req.body.username,
        email: req.body.email,
        avatar,
        password: req.body.password
      });

      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(newUser.password, salt, (err, hash) => {
          if(err) throw err;
          newUser.password = hash;
          newUser.save()
              .then(user => res.json(user))
              .catch(err => console.log(err));
        })
      })
    }
  })
});

// @route POST authentication/login
// Login user, returning the Token
// Public
router.post('/login', (req, res) => {
  const { errors, isValid}  = validateLoginInput(req.body);

  // Check validation
  if(!isValid) {
    return res.status(400).json(errors)
  }

  const email = req.body.email;
  const password = req.body.password;

  // find the user by email
  User.findOne({ email })
    .then(user => {
        // check for user
        if(!user) {
          errors.email = 'User not found';
          return res.status(404).json(errors);
        }
          // check password
          bcrypt.compare(password, user.password)
              .then(isMatch => {
                if(isMatch) {
                  // user matched

                  // create the payload
                  const payload = { id: user.id, username: user.username, avatar: user.avatar}
                  // sign the token
                  jwt.sign(payload,
                     keys.secretOrKey,
                      { expiresIn: 3600},
                      (err, token) => {
                      res.json({
                        success: true, 
                        token: 'Bearer ' + token
                      });
                  });
                } else {
                  errors.password = 'Password incorrect';
                  return res.status(400).json(errors);
                }
              })
    });
});

// @route POST authentication/current
// return current user
// Private
router.get('/current', passport.authenticate('jwt', { session: false}), (req, res) => {
  res.json({
    id: req.user.id,
    username: req.user.username,
    email: req.user.email
  });
})

module.exports = router;