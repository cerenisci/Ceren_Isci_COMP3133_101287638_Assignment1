const mongoose = require('mongoose');

const EmployeeSchema = new mongoose.Schema({
  first_name: String,
  last_name: String,
  email: String,
  gender: String,
  designation: String,
  salary: Number,
  date_of_joining: String,
  department: String,
  employee_photo: String
});

module.exports = mongoose.model('Employee', EmployeeSchema);
