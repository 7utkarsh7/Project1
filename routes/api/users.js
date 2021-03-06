const express = require("express");
const router = express.Router();
const gravatar = require("gravatar");
const {check,validationResult} = require("express-validator");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const config= require("config");
const User = require("../../models/User");

//route    get api/user
//test     test route
////access public
router.post("/",[
    check("name", "name is required").not().isEmpty(),
    check("email","please include valid email").isEmail(),
    check("password", "please enter correct password with more than 8 characters").isLength({min: 8})
], async (req,res)=>{

    const errors= validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()});
    }

const {name, email, password} = req.body;
try {
 
//check if user exists
let user = await  User.findOne({email});

if(user){
 return res.status(400).json({errors:[{msg: "User already exists"}] });
}
//get user gravatar
const avatar = gravatar.url(email,{
    s:"200",
    r:"pg",
    d:"mm"
})
user = new User({
    name, 
    email,
    avatar,
    password
});
//encrypt password
const salt = await bcrypt.genSalt(10);
user.password = await bcrypt.hash(password, salt);
await user.save();

//return jwt

const payload ={
    user:{
        id: user.id
    }
}

jwt.sign(
    payload, 
    config.get("jwtSecret"),
    {expiresIn: 360000},
    (err,token)=>{
        if (err) throw err;
        res.json({token});
    }
    );
    
} catch (error) {
    console.log(error.message);
    res.status(500).send("server error");
}
});

module.exports = router;