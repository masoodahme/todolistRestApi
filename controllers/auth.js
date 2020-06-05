const express=require("express");
const router=express.Router();
//models
const User=require("../models/users");
const { check, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const expressJwt=require("express-jwt");
exports.signup=(req,res)=>{
  const errors=validationResult(req);
  if(!errors.isEmpty()){
      return res.status(422).json({
          errors:errors.array()[0].msg
      })
}

const user=new User(req.body);
 user.save((err,users)=>{
     if(err)
     {
        console.log(err);
        return res.status(400).json({
            err:"Not able to save user in DB"
        });
     }
     res.json({
         name:users.name,
         email:users.email,
         id:users._id,
         password:users.encrypt_password
     });
 })

};
let refreshtoken="";
let refreshTokens=[];
exports.signin=(req,res)=>{
    const {email,password}=req.body;
 const errors=validationResult(req);
 if(!errors.isEmpty())
 {
     return res.status(422).json({
         errors:errors.array()[0].msg
     })
 }
 User.findOne({email:email},(err,user)=>{
    
     if(err)
     {
        console.log(err);
        return res.status(400).json({
            err:"error in connection"
        });
     }
     if(!user)
     {
        console.log(err);
        return res.status(400).json({
            err:"Not able to find user in DB"
        });
     }

    if(!user.authenticate(password))
    {
        console.log(err);
        return res.status(401).json({
            err:"Email and password does not exists"
        });
    }

     //Access token created
    const accesstoken=jwt.sign({_id:user.id},process.env.SECRET);
 
    //refresh token
     refreshtoken=jwt.sign({_id:user.id},process.env.REFRESHTOKENSECRET,{expiresIn:86400});
    refreshTokens.push(refreshtoken);
   
    // //put token in cookie
    // res.cookie("token",token,{expire:new Date()+9999});
     //destructuring
    const {_id,email,name}=user;
    res.json({user:{
        name:name,
        email:email,
        id:_id,
        token:accesstoken,
        refreshtoken:refreshtoken
    } 
    });
    
 })
};
exports.isSignedIn=expressJwt({
    secret:process.env.SECRET,
    userProperty:"auth" //it holds the user _id which is generated when the user is signed in
});
exports.isAuthorized=(req,res,next)=>{
    //req.user is set when user is singed in and req.auth is present in isSignedIn
    console.log("2");
    console.log(req.profile);
    console.log(req.profile._id);
     console.log(req.auth._id);
    let checker=req.profile && req.auth && req.profile==req.auth._id;
    console.log(checker);
    if(!checker)
    {   
        return res.status(403).json({
            "message":"Access Denied"
        })

    }
    next();
};
exports.generateToken=(req,res)=>{
    console.log("d");
        const { refreshtoken } = req.body;

        if (!refreshtoken) {
            return res.sendStatus(401);
        }
    
        if (!refreshTokens.includes(refreshtoken)) {
            return res.sendStatus(403);
        }
    
        jwt.verify(refreshtoken, process.env.REFRESHTOKENSECRET, (err, user) => {
            if (err) {
                return res.sendStatus(403);
            }
            const accessToken = jwt.sign({_id:user.id}, process.env.SECRET, { expiresIn: '20m' });
    
            res.json({
                accessToken
            });
        });

}
exports.signout=(req,res)=>{
    // res.clearCookie("token");
    const { refreshtoken } = req.body;
    console.log(refreshtoken);
    
    
        refreshTokens = refreshTokens.filter(t => t !== refreshtoken);
   
    console.log(refreshTokens);

    res.json({
        message:"user has signed out"
    })
}

