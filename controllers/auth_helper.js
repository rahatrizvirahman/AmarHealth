const mongoose = require('mongoose')
const bcrypt = require('bcryptjs');
const cryptoRandomString = require('crypto-random-string');
const User = require("../models/userInfo")
const Doctor = require("../models/doctor").doctorModel;
const UrlRandomString = require("../models/randomStringForURL").randomStringModel;

const { sendMail } = require('./mailController')

function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    if (typeof req.session.currentLoggedIn != 'undefined' && req.session.currentLoggedIn == 'doctor') {
      req.flash('error_msg', 'Please log in as General User to view that resource')
      res.redirect('back');
      return
    }
    console.log('here1')
    return next();
  }
  req.session.returnTo = req.originalUrl;
  req.flash('error_msg', 'Please log in to view that resource')
  res.redirect('/auth/login');
}


function checkAuthenticatedDoctor(req, res, next) {
  if (req.isAuthenticated()) {
    if (typeof req.session.currentLoggedIn != 'undefined' && req.session.currentLoggedIn == 'patient') {
      req.flash('error_msg', 'Please log in as Doctor to view that resource')
      res.redirect('back');
      return
    }
    console.log('here2')
    return next();
  }
  req.session.returnTo = req.originalUrl;
  req.flash('error_msg', 'Please log in to view that resource')
  res.redirect('/auth/login');
}

function checkNotAuthenticated(req, res, next) {
  if (!req.isAuthenticated()) {
    return next();
  }
  req.flash('success_msg', 'You are already logged in')
  res.redirect('back');
}


let checkEmailNotVerified = async (req, res, next) => {
  if(!req.user.emailVerified) {
    return next()
  }
  console.log('here3')
  req.flash('success_msg', 'You email is already verified')
  res.redirect('back');
}

let checkEmailVerified = (req, res, next) => {
  let currentLoggedIn = req.session.currentLoggedIn;

  if (req.user.emailVerified) {
    return next()
  }
  if (typeof currentLoggedIn != 'undefined') {
    req.flash('error_msg', 'Please verify your email first.')
    res.redirect(`/auth/accountVerification/${currentLoggedIn}`);
    return;
  }

  // No role is assigned to req.session.currentLoggedIn. So we can't figure to which route we need to direct
  if (req.user) {
    delete req.session.currentLoggedIn;
    req.logout();
  }
  req.flash(
    "error_msg",
    "Error occured. Please log in again."
  );
  res.redirect("/auth/login");
  return
}

async function postResetPass(req, res) {
  let navDisplayName = req.user.name.displayName;

  const {
    password,
    password2
  } = req.body

  let errors = [];

  if (
    !password ||
    !password2
  ) {
    errors.push({ msg: "Please enter all required fields" });
  }

  if (password != password2) {
    errors.push({ msg: "Passwords do not match" });
  }

  if (password.length < 6) {
    errors.push({ msg: "Password must be at least 6 characters" });
  }


  if (errors.length > 0) {
    res.render("resetPass", { navDisplayName, errors });
  } else {
    let user = await User.findOne({ email: req.user.email })
    user.password = password

    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(user.password, salt, async (err, hash) => {
        if (err) res.render('404', { error: err.message });
        user.password = hash;
        await user.save()
        res.redirect('/');
      });
    });

  }
}

async function postResetPassDoctor(req, res) {
  console.log(req.body)

  let navDisplayName = req.user.name.displayName;

  const {
    password,
    password2
  } = req.body

  let errors = [];

  if (
    !password ||
    !password2
  ) {
    errors.push({ msg: "Please enter all required fields" });
  }

  if (password != password2) {
    errors.push({ msg: "Passwords do not match" });
  }

  if (password.length < 6) {
    errors.push({ msg: "Password must be at least 6 characters" });
  }


  if (errors.length > 0) {
    res.render("resetPass", { navDisplayName, errors });
  } else {
    let user = await Doctor.findOne({ email: req.user.email })
    user.password = password

    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(user.password, salt, async (err, hash) => {
        if (err) res.render('404', { error: err.message });
        user.password = hash;
        await user.save()
        res.redirect('/');
      });
    });

  }
}

async function forgotpassHandler(req, res) {
  const { role, emailOrPhone } = req.body
  console.log('came in forgotpass')
  console.log(req.body)
  try {
    // selecting User or Doctor model according to role field value
    model = (role=='patient')? User : Doctor
    subject = (role=='patient')? 'General account passowrod forgotten' : 'Doctor account passowrod forgotten'
    let otp = cryptoRandomString({ length: 6 });
    let hashedOtp = ''

    // hashing the otp before saving to database
    bcrypt.genSalt(10, async (err, salt) => {
      bcrypt.hash(otp, salt, async (err, hash) => {
        if (err) {
          console.error(err);
          res.send({ error: err.message })
        }
        hashedOtp = hash
        let user = await model.findOneAndUpdate(
          {
            $or: [{ email: emailOrPhone }, { phoneNumber: emailOrPhone }]
          },
          {
            otp: hashedOtp
          },
          {
            new: true
          }
        )
        if(typeof user==='undefined'){
          console.log('user wasnot found with this credential')
          res.send({ error: "User is not registered" })
        }
        // sending mail
        let mailData = {
          mailTo: user.email,
          subject: subject,
          msg: `Dear user, We are providing you an one time password.Please use this one time password to login.` +
            `After login please change the password. Your one time password is:\n ${otp}\n `,
        }
        sendMail(mailData)

      });
    });
    res.send({ success: "We have sent you an email with temporary password" });

  } catch (err) {
    console.error(err);
    res.send({ error: err.message })
    // throw err
  }
}


let emailVerificationLinkGenerator = async (req, res) => {
  console.log(req.body)
  const { role, email } = req.body
  console.log('came in accountVerification')

  if (role == "role not found") {
    if (req.user) {
      delete req.session.currentLoggedIn;
      req.logout();
    }
    req.flash(
      "error_msg",
      "Error occured. Please log in again."
    );
    res.redirect("/auth/login");
    return
  }
  else if (email == "email not found") {
    if (req.user) {
      delete req.session.currentLoggedIn;
      req.logout();
    }
    req.flash(
      "error_msg",
      "Error occured. Please log in again."
    );
    res.redirect("/auth/login");
    return
  }
  try {
    if (role == "patient") {
      let patient = await User.findOne({ email: email })
      if (patient) {
        let existingRandomString = await UrlRandomString.findOne({ userID: patient._id, userType: role })
        let newRandomString = cryptoRandomString({ length: 64, type: 'url-safe' })
        if (existingRandomString) {
          existingRandomString.randomString = newRandomString
          await existingRandomString.save()
        }
        else {
          let urlRandomString = new UrlRandomString({
            userID: patient._id,
            userType: role,
            randomString: newRandomString
          })
          await urlRandomString.save()
        }

        let host = req.get('host');
        let linkForVerification = `http://${host}/auth/verify_email/${newRandomString}`;
        console.log(linkForVerification)

        let mailData = {
          mailTo: email,
          subject: 'Care for me - Verify your email address',
          msg: `Hi ${patient.name.firstName},\n` +
            `Thank you for registering your account on Care for me!\n` +
            `We are sending you this email to verify your email address. Simply click the link below, look for the success message:\n` +
            `${linkForVerification}\n`,
        }
        sendMail(mailData)
        req.flash("success_msg", "We have sent you an email with a link for verification");
        res.redirect("/auth/accountVerification/patient")
      }
      else {
        // no patient is found with that email
        if (req.user) {
          delete req.session.currentLoggedIn;
          req.logout();
        }
        req.flash(
          "error_msg",
          "Error occured. Please log in again."
        );
        res.redirect("/auth/login");
        return
      }
    }
    else if (role == "doctor") {
      let doctor = await Doctor.findOne({ email: email })
      if (doctor) {
        let existingRandomString = await UrlRandomString.findOne({ userID: doctor._id, userType: role })
        let newRandomString = cryptoRandomString({ length: 64, type: 'url-safe' })
        if (existingRandomString) {
          existingRandomString.randomString = newRandomString
          await existingRandomString.save()
        }
        else {
          let urlRandomString = new UrlRandomString({
            userID: doctor._id,
            userType: role,
            randomString: newRandomString
          })
          await urlRandomString.save()
        }

        let host = req.get('host');
        let linkForVerification = `http://${host}/auth/verify_email/${newRandomString}`;
        console.log(linkForVerification)

        let mailData = {
          mailTo: email,
          subject: 'Care for me - Verify your email address',
          msg: `Hi ${doctor.name.firstName},\n` +
            `Thank you for registering your account on Care for me!\n` +
            `We are sending you this email to verify your email address. Simply click the link below, look for the success message:\n` +
            `${linkForVerification}\n`,
        }
        sendMail(mailData)
        req.flash("success_msg", "We have sent you an email with a link for verification");
        res.redirect("/auth/accountVerification/doctor")
      }
      else {
        // no doctor is found with that email
        if (req.user) {
          delete req.session.currentLoggedIn;
          req.logout();
        }
        req.flash(
          "error_msg",
          "Error occured. Please log in again."
        );
        res.redirect("/auth/login");
        return
      }
    }
    else {
      // Specified role is invalid
      if (req.user) {
        delete req.session.currentLoggedIn;
        req.logout();
      }
      req.flash(
        "error_msg",
        "Error occured. Please log in again."
      );
      res.redirect("/auth/login");
      return
    }
  } catch (err) {
    console.error(err);
    res.render("404", { error: err.message });
    return
  }
}

let emailVerificationHandler = async (req, res) => {
  let hash = req.params.hash;
  try {
    let existingRandomString = await UrlRandomString.findOne({ randomString: hash })
    if (existingRandomString) {
      let role = existingRandomString.userType;
      let ID = existingRandomString.userID;
      await UrlRandomString.deleteOne({ _id: existingRandomString._id })

      if (role == 'patient') {
        let patient = await User.findById(ID);
        if (patient) {
          patient.emailVerified = true;
          await patient.save()

          let redirectUrl = req.session.returnTo || "/home"
          req.flash('success_msg', 'Email verification is successfully completed.')
          res.redirect(redirectUrl)
        }
        else {
          // stored patient ID is invalid
          if (req.user) {
            delete req.session.currentLoggedIn;
            req.logout();
          }
          req.flash(
            "error_msg",
            "Verification link is not working. Please login and try to verify with a new link again."
          );
          res.redirect("/auth/login");
          return
        }
      }
      else {
        let doctor = await Doctor.findById(ID);
        if (doctor) {
          doctor.emailVerified = true;
          await doctor.save()

          let redirectUrl = req.session.returnTo || "/home"
          req.flash('success_msg', 'Email verification is successfully completed.')
          res.redirect(redirectUrl)
        }
        else {
          // stored doctor ID is invalid
          if (req.user) {
            delete req.session.currentLoggedIn;
            req.logout();
          }
          req.flash(
            "error_msg",
            "Verification link is not working. Please login and try to verify with a new link again."
          );
          res.redirect("/auth/login");
          return
        }
      }
    }
    else {
      // no such random string stored in the db
      if (req.user) {
        delete req.session.currentLoggedIn;
        req.logout();
      }
      req.flash(
        "error_msg",
        "Verification link expired. Please login and try to verify with a new link again."
      );
      res.redirect("/auth/login");
      return
    }
  } catch{
    console.error(err);
    res.render("404", { error: err.message });
    return
  }
}

module.exports = {
  forgotpassHandler,
  postResetPass,
  postResetPassDoctor,
  checkAuthenticated,
  checkNotAuthenticated,
  checkAuthenticatedDoctor,
  emailVerificationHandler,
  emailVerificationLinkGenerator,
  checkEmailVerified,
  checkEmailNotVerified
}
