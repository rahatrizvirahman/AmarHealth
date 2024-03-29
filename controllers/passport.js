const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');

// Load Patient model
const Patient = require('../models/patient');
const Doctor = require("../models/doctor").doctorModel;
const Admin = require("../models/admin").adminModel;

const {checkNotNull}= require("./functionCollection")

module.exports = {
  patientStrategy: function(passport) {
  passport.use( 
    'patientStrategy',   
    new LocalStrategy({ usernameField: 'emailOrPhone',passReqToCallback: true }, (req,emailOrPhone, password, done) => {
      // Match user
      Patient.findOne({
        // email: email
        // email: emailOrPhone
        $or: [ { email: emailOrPhone }, { phoneNumber: emailOrPhone } ] 
      }).then(async (patient) => {
        if (!patient) {
          return done(null, false, { message: 'That email or phone no is not registered' });
        }
        console.log('in passport strategy for patient')
        console.log(patient)
        // Match password

        try{
          let  patientOtp = ''
          if(checkNotNull(patient.otp)){
            console.log('checking otp')          
            patientOtp = patient.otp                     
          }
          // console.log(password, patient.password, patientOtp)
          // console.log(typeof(password), typeof(patient.password), typeof(patientOtp))
          // console.log(String(password), String(patient.password), String(patientOtp))
          

          let passwordMatch = await bcrypt.compare(String(password), String(patient.password));
          let otpMatch = await bcrypt.compare(String(password), String(patientOtp));
          // console.log(passwordMatch, "  ",otpMatch)
          if(passwordMatch|| otpMatch){
            req.session.currentLoggedIn = 'patient';
            // resetting otp
            patient.otp =''
            await patient.save() 
            return done(null, patient);
          } 
          else {
            return done(null, false, { message: 'Password incorrect' });
          }
        }catch(err){
          console.error(err)
        }

      });
    })
  );

  // passport.serializeUser(function(user, done) {
  //   done(null, user.id);
  // });

  // passport.deserializeUser(function(id, done) {
  //   Patient.findById(id, function(err, user) {
  //     done(err, user);
  //   });
  // });
},
doctorStrategy: function(passport) {
  passport.use(    
    'doctorStrategy',
    new LocalStrategy({ usernameField: 'emailOrPhone', passReqToCallback: true },  (req, emailOrPhone, password, done) => {
      // Match user
      Doctor.findOne({
        // email: email
        // email: emailOrPhone
        $or: [ { email: emailOrPhone }, { phoneNumber: emailOrPhone } ] 
      }).then(async (doctor) => {
        if (!doctor) {
          return done(null, false, { message: 'That email or phone no is not registered' });
        }

        
        console.log('in passport strategy for doctor')
        console.log(doctor)

        // Match password
        try{
          let  doctorOtp=''
          if(checkNotNull(doctor.otp)){
            console.log('checking otp')          
            doctorOtp = doctor.otp                
          }
          // console.log(password, doctor.password, doctorOtp)
          // console.log(typeof(password), typeof(doctor.password), typeof(doctorOtp))
          // console.log(String(password), String(doctor.password), String(doctorOtp))

          let passwordMatch = await bcrypt.compare(String(password), String(doctor.password));
          let otpMatch = await bcrypt.compare(String(password), String(doctorOtp));
          console.log('for doctor:', passwordMatch, "  ",otpMatch)
          if(passwordMatch|| otpMatch){
            req.session.currentLoggedIn = 'doctor';
            // resetting otp
            doctor.otp =''
            await doctor.save()
            return done(null, doctor);
          } 
          else {
            return done(null, false, { message: 'Password incorrect' });
          }
        }catch(err){
          console.error(err)
        }

      });
    })
  );

  // passport.serializeUser(function(user, done) {
  //   done(null, user.id);
  // });

  // passport.deserializeUser(function(id, done) {
  //   Doctor.findById(id, function(err, user) {
  //     done(err, user);
  //   });
  // });
},

adminStrategy: function(passport) {
  passport.use(    
    'adminStrategy',
    new LocalStrategy({ usernameField: 'email', passReqToCallback: true },  (req, email, password, done) => {
      // Match user
      Admin.findOne({
        // email: email
        email: email
      }).then(async (user) => {
        // console.log("admin user in passort")
        // console.log({user})

        if (!user) {
          return done(null, false, { message: 'That email or phone no is not registered' });
        }

        try{
          // console.log(password, user.password, userOtp)
          // console.log(typeof(password), typeof(user.password), typeof(userOtp))
          // console.log(String(password), String(user.password), String(userOtp))

          let passwordMatch = await bcrypt.compare(String(password), String(user.password));
          // console.log(passwordMatch)
          if(passwordMatch){
            req.session.currentLoggedIn = 'admin';
            return done(null, user);
          } 
          else {
            return done(null, false, { message: 'Password incorrect' });
          }
        }catch(err){
          console.error(err)
        }

      });
    })
  );

  // passport.serializeUser(function(user, done) {
  //   done(null, user.id);
  // });

  // passport.deserializeUser(function(id, done) {
  //   Admin.findById(id, function(err, user) {
  //     done(err, user);
  //   });
  // });
}
}