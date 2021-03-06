const express=require("express");
const router=express.Router();
//User models
const User=require("../models/users");
const jwt = require('jsonwebtoken');
const expressJwt=require("express-jwt");
//get id of the user
exports.getId=(req,res,next)=>{
    //get user id from jwt token payload
    var Bearer=req.headers.authorization.split(" ")[0];
    if((req.headers.authorization)&&((Bearer=='Bearer')||(Bearer=='bearer')))
    {
        var token=req.headers.authorization.split(" ")[1];
        try {
            decoded = jwt.verify(token, process.env.SECRET);
          }
         catch (e) {
            return res.status(401).json({
                message:"You are not authorized",
                error:e
            });
          }
    }
    else{
        return res.status(401).json({
            message:"You are not authorized",
        })
    }
    //set the user id to req.profile
    req.profile=decoded._id;
    next();
};

