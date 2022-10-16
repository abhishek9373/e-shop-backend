const mongoose = require('mongoose')

// productidSchems
const prdidSchema = new mongoose.Schema({
    pid:String
})


// admin schema
const adminschema = new mongoose.Schema({
    name:String,
    adminid:String,
    password:String,
})

// new user schema
const userschema = new mongoose.Schema({
    name:{
        type:String,
        
    },
    email:{
        type:String,
        
    },
    address:{
        type:String,
        
    }, 
    password:{
        type:String,
        
    }, 
    userid:{
        type:Number,
    },
    admin:{
        type:Boolean,
        default:false
    },
    orders:Array,
    cart:Array
}) ;

// current id schema 
const idschema = new mongoose.Schema({
    cid:Number
})

// product Schema
const productschema = new mongoose.Schema({
    name:String,
    description:String,
    price:Number,
    rating:Number,
    qauntity:Number,
    details:String,
    productid:Number,
    img:{
        data:Buffer,
        contentType:String
    }
})

module.exports = {userschema,idschema,productschema,prdidSchema};