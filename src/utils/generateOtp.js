const crypto = require("crypto");

// const generateOtp = () => {
//   return Math.floor(100000 + Math.random() * 900000).toString();

// }  it is predictable

const generateOtp = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// const otp = generateOtp();
// console.log(otp);
module.exports = generateOtp;

// randomInt(min,max);