const express = require('express'); //Importing expres library
const app = express()
const {pool} = require("./static/dbConfig");//Pulls library in from dbConfig file 
const bcrypt = require('bcrypt');//Hides password
const session = require('express-session');
const flash = require("express-flash");
app.use("/static", express.static('./static/'));
const passport = require("passport");

const initializePassport = require("./passportConfig.js");

initializePassport(passport);

//Acts like the heart of the machine
const PORT = process.env.PORT || 4000; //Port that will be used for development 


app.set("view engine","ejs");
app.use(express.urlencoded({extended: false})); //Middleware to send details from fron end to the server 

app.use(session({
    secret: "secret",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());


app.get('/',(req,res)=>{ //Callback function that will be invoked whenever there is a HHTTP GET request with a path / relative to the site root
    res.render("index"); //Sending message 

});

app.get('/users/dashboard', checkNotAuthenticated,(req,res)=>{ //Callback function that will be invoked whenever there is a HHTTP GET request with a path / relative to the site root
    //console.log(req.user.User_id) ; //Sending message 
    pool.query(
        `SELECT * FROM public."User" WHERE "User_id" = $1;`,
        [req.user.User_id],
        (err,results) =>{
            if(err){
                throw err;
            }
         const user = results.rows[0];

         if(user.type.trim()=== "Manager")
         {
            res.locals.user = req.user.Name;
            res.locals.User_id = req.user.User_id;
            
            pool.query(
                `SELECT user_id, shift_id FROM public."Manager" WHERE "manager_id" = $1;`,
                [req.user.User_id],
                (err,results) =>{
                    if(err){
                        throw err;
                    }
                    
                    
                    var employees = new Array(results.rows.length);// Lenght of the results of the SQL query

                    
                    
                    var j = 0
                    for(i=0;i<employees.length;i++)
                    {
                        const user = results.rows[i];
                        // var temp = new Array(2);
                        // temp[0] = user.user_id.trim();
                        // temp[1] = user.shift_id.trim();
                        // employees[i] = temp;
                        employees[i]=
                        {
                            user_id: user.user_id.trim(),
                            shift_id: user.shift_id.trim(),
                        }
                        
                    }
                        
                    console.log(employees[0].shift_id);
                    res.locals.employees = employees; 
                    res.render("dashboard_admin",{employees:employees}) ;
                }
            );
           
         }
         else if (user.type.trim()=== "Employee") {
            res.render("dashboard_employee",{ user: req.user.Name}) ;
         } 
                    
    });
});

app.get('/users/register', checkAuthenticated,(req,res)=>{ //Callback function that will be invoked whenever there is a HHTTP GET request with a path / relative to the site root
    res.render("register"); //Sending message 
});

app.get('/users/login', checkAuthenticated,(req,res)=>{ //Callback function that will be invoked whenever there is a HHTTP GET request with a path / relative to the site root
    res.render("login"); //Sending message 
});

app.post('/users/register', async (req,res) =>{
    let{User_id,Name,password,accounttype} = req.body;

console.log({
    User_id,
    Name,
    password
}); 
    let errors = [];
    // Checks for errors 
    if(!User_id||!Name||!password||!accounttype)
    {
        errors.push({message:"Enter all fields"});
    }

    if(password.length<6)
    {
        errors.push({message:"Password needs to be longer"});
    }

    
    if(errors.length > 0)
    {
        res.render("register",{errors}); //If any errors are found then information is sent to the register page
    }
    else
    { //Form validation has been passed
        let hashedPassword = await bcrypt.hash(password, 10); //Hashes the password
        pool.query(
            `SELECT * FROM public."User" WHERE "User_id" = $1;`,
            [User_id],
            (err,results) =>{
                if(err) {
                    throw err;
                }
            console.log("HERE:");
            console.log(results.rows);
            if(results.rows.length > 0)
            {
                errors.push({message: "User already registered"});
                res.render('register',{errors});
            }
            else
            {
                pool.query(
                    `INSERT INTO public."User" ("User_id","password","Name","type") VALUES ($1,$2,$3,$4);`,
                    [User_id,hashedPassword,Name,accounttype],
                    (err,results) =>{
                        if(err) {
                            throw err;
                        }
                        console.log(results.rows);
                        req.flash('success_msg',"Created User");
                        res.redirect("/users/login");
                    }
                );
            }
        }     
        );
    }
});


app.post(
    "/users/login",
    passport.authenticate("local", {
      successRedirect: "/users/dashboard",
      failureRedirect: "/users/login",
      failureFlash: true
    })
  );
    
 
  function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return res.redirect("/users/dashboard_admin");
    }
    next();
  }
  
  function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
         
        return next();
    }
    res.redirect("/users/login");
  } 

app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});