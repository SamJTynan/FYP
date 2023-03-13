const localStrategy  = require("passport-local").Strategy;
const { pool } = require('./static/dbConfig.js');

const bcrypt = require("bcrypt");
const { authenticate } = require("passport");

function initialize(passport) {

    const authenticateUser = (User_id,password,done)=>{
        pool.query(
            `SELECT * FROM public."User" WHERE "user_id" = $1;`,
            [User_id],
            (err,results) =>{
                if(err){
                    throw err;
                }
             
                if(results.rows.length >0) {
                    const user = results.rows[0];
                  
                   
                    bcrypt.compare(password, user.password.trim(), (err, isMatch) => {
                      if (err) {
                         console.log(err);
                      }
                      if (isMatch) {
                        return done(null, user,User_id);
                        
                        
                      } else {
                        console.log("False");
                        //password is incorrect
                       return done(null, false, { message: "Password is incorrect" });
                      }
                    });
                }
                else{
                    return done(null,false, {message: "User is not registered"});
                }
            }
        );
    };


    passport.use(
        new localStrategy({
            usernameField: "User_id",
            passwordField: "password"
        }, 
        authenticateUser
        
        )
    );
    
    passport.serializeUser(function(user, done) {
      done(null, user);
    });


    passport.deserializeUser(function(user, done) {
      done(null, user);
    });
}   

module.exports = initialize; //Exports initialize function
