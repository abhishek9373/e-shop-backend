const mongoose = require('mongoose')
const userschema = require('./Allschemas')
const idschema = require('./Allschemas')
const productschema = require('./Allschemas')
const adminschema = require('./Allschemas')
const prdidSchema = require('./Allschemas')




const usermodel = new mongoose.model('users',userschema);

const idmodel = new mongoose.model('cuid',idschema);

const productmodel = new mongoose.model('products',productschema);

const adminmodel = new mongoose.model('admin',adminschema)

const pidmodel = new mongoose.model('productid',prdidSchema)

module.exports = {usermodel,idmodel,productmodel,adminmodel,pidmodel}