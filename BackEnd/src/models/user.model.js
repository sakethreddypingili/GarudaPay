const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

// creating schema for storing user data in db
const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase:true,
            trim:true
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            select: false
        },
        balance: {
            type: Number,
            default: 0
        },
        resetPasswordToken: {
            type: String,
            select: false
        },
        resetPasswordExpiry: {
            type: Date,
            select: false
        }
    },
    {
        timestamps: true
    }
)

// hashes password before send it to the database
userSchema.pre("save", async function() {
    if (!this.isModified("password")) return; //if the password is not reset then it won't be hashed 
    this.password = await bcrypt.hash(this.password, 10); // as per the standards it will go through 10 alting rounds
});


// comparing password at the time of login
userSchema.methods.isPasswordCorrect = async function (plainText) {
    // this compaes the raw and hashed password
    return bcrypt.compare(plainText, this.password);
}


module.exports = mongoose.model("User", userSchema);
