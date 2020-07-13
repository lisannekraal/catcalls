const mongoose = require("mongoose");

const catcallSchema = new mongoose.Schema({
    type: String,
    geometry: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number], //a list of numbers
            required: true
        }
    },
    properties: {
        description: String,
        date: String,
        context: String,
        verified: {
            type: Boolean,
            default: false
        },
        img: { 
            data: Buffer, 
            contentType: String 
        }
    }
});

module.exports = mongoose.model("Catcall", catcallSchema);