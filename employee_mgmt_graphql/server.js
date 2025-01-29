require('dotenv').config();
const express = require('express');
const { ApolloServer, gql } = require('apollo-server-express');
const mongoose = require('./config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Employee = require('./models/Employee');

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error(err));

const typeDefs = gql`
  type User {
    username: String!
    email: String!
  }

  type Employee {
    _id: ID!
    first_name: String!
    last_name: String!
    email: String!
    gender: String!
    designation: String!
    salary: Float!
    date_of_joining: String!
    department: String!
    employee_photo: String
  }

  type Query {
    login(username: String!, password: String!): String
    getAllEmployees: [Employee]
    searchEmployeeByEid(eid: ID!): Employee
    searchEmployeeByDesignationOrDepartment(designation: String, department: String): [Employee]
  }

  type Mutation {
    signup(username: String!, email: String!, password: String!): String
    addEmployee(first_name: String!, last_name: String!, email: String!, gender: String!, designation: String!, salary: Float!, date_of_joining: String!, department: String!, employee_photo: String): Employee
    updateEmployeeByEid(eid: ID!, first_name: String, last_name: String, email: String, gender: String, designation: String, salary: Float, date_of_joining: String, department: String, employee_photo: String): Employee
    deleteEmployeeByEid(eid: ID!): String
  }
`;

const resolvers = {
  Query: {
    login: async (_, { username, password }) => {
      const user = await User.findOne({ username });
      if (!user) throw new Error('User not found');
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) throw new Error('Invalid credentials');
      return jwt.sign({ username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
    },
    getAllEmployees: async () => await Employee.find(),
    searchEmployeeByEid: async (_, { eid }) => await Employee.findById(eid),
    searchEmployeeByDesignationOrDepartment: async (_, { designation, department }) => {
      return await Employee.find({ $or: [{ designation }, { department }] });
    }
  },
  Mutation: {
    signup: async (_, { username, email, password }) => {
      const hashedPassword = await bcrypt.hash(password, 10);
      await User.create({ username, email, password: hashedPassword });
      return 'User registered successfully';
    },
    addEmployee: async (_, args) => await Employee.create(args),
    updateEmployeeByEid: async (_, { eid, ...updates }) => await Employee.findByIdAndUpdate(eid, updates, { new: true }),
    deleteEmployeeByEid: async (_, { eid }) => {
      await Employee.findByIdAndDelete(eid);
      return 'Employee deleted successfully';
    }
  }
};

const server = new ApolloServer({ typeDefs, resolvers });

const app = express();
server.applyMiddleware({ app });

app.listen({ port: 4000 }, () => {
  console.log(`Server running at http://localhost:4000${server.graphqlPath}`);
});
