
const pool                 = require('../config/db.js');
let jwt                    = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const camelcaseKeys        = require('camelcase-keys');

let secret = process.env.JWT_SECRET;


class HandlerGenerator {
  login (req, res) {
    let username = req.body.username;
    let password = req.body.password;
    // let mockedUsername = 'mj@gmail.com';
    // let mockedPassword = '12345678';    
    if (username && password) {
      pool.query('SELECT * FROM users WHERE email = $1 AND password = $2', [username,password], (error, results) => {
        // console.log(results.rows);
        if(error){
          throw error;
        }
        //if (username === mockedUsername && password === mockedPassword) {
        if(results.rowCount===1){
          //console.log(results.rows[0].id);
          let token = jwt.sign({username: username},
            secret,
            { expiresIn: '24h' 
            }
          );
          res.status(200).json({
            success: true,
            message: 'Authentication successful!',
            token: token,
            id:results.rows[0].id,
            name:results.rows[0].email
          });
        }else{
          res.status(400).json({ 
            success: false,
            message: 'Incorrect email or password'
          });
        } 

      });          
    }else{   
      res.status(400).json({ 
        success: false,
        message: 'Authentication failed! Please check the request'
      });     
    }
  }
  index (req, res) {
    res.status(200).json({
      success: true,
      message: 'Index page'
    });
  }  
  
}

const authenticateToken = (req, res) =>{
  let token = req.headers['x-access-token'] || req.headers['authorization']; 
  if (token) {
    if (token.startsWith('Bearer ')) {
      token = token.slice(7, token.length);
    }
    jwt.verify(token, secret, (err, decoded) => {
      if (err) {
        return res.status(200).json({
          success: false,
          message: 'Token is not valid'
        });
      } else {
        req.decoded = decoded;
        //console.log(decoded);
        res.status(200).json({
          success: true,
          message: 'Authentication successful!',
          data:decoded
        });
      }
    });
  }else{
    return res.status(400).json({
      success: false,
      message: 'Auth token is not supplied'
    });
  }
}

const getUserByUsername = (req,res)=>{
  let token = req.headers['x-access-token'] || req.headers['authorization']; 
  if (token) {
    if (token.startsWith('Bearer ')) {
      token = token.slice(7, token.length);
    }
    jwt.verify(token, secret, (err, decoded) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: 'Token is not valid'
        });
      } else {
        const username = req.params.username; 
        if(username && username===decoded.username){
          pool.query('SELECT id as user_id,role_id,first_name,last_name,email,phone_number as phone_number, gender, dob,designation,experience, password,terms_agree,profile_photo FROM users WHERE email = $1', [username], (error, results) => {
            if (error) {
              throw error
            }
            let data = camelcaseKeys(results.rows);
            res.status(200).json(data)
          })
        }else{
          return res.status(400).json({
            success: false,
            message: 'Token is not valid'
          });
        }
      }
    });

  }else{
    return res.status(400).json({
      success: false,
      message: 'Auth token is not supplied'
    });
  }

}

const getUsers= (req, res)=>{
  let token = req.headers['x-access-token'] || req.headers['authorization']; 
  if (token) {
    if (token.startsWith('Bearer ')) {
      token = token.slice(7, token.length);
    }
    jwt.verify(token, secret, (err, decoded) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: 'Token is not valid'
        });
      } else {
        pool.query(
          "SELECT id,INITCAP(first_name) as first_name,INITCAP(last_name) as last_name, INITCAP (CONCAT(first_name,' ', last_name)) as full_name, email,phone_number,dob,designation,profile_photo FROM users ORDER BY id ASC", 
          (error,results)=>{
              if(error){
                  throw error;
              }
              let data = camelcaseKeys(results.rows);

              let totalElements = results.rows.length;
              let totalPages    = '';
              res.status(200).json({
                success: true,
                results:{
                  data:data,
                  totalElements:totalElements,
                  totalPages:totalPages
                } 
              })
        });
      }
    });

  }else{
    return res.status(400).json({
      success: false,
      message: 'Auth token is not supplied'
    });
  }
  
}

const getUserDetailsById = (req, res) => {

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Error Occured'
    });
  }
  const id = parseInt(req.params.id);
    pool.query(
    'SELECT id as user_id,first_name,last_name,email,phone_number as phone_number, gender, dob,designation,experience,password,profile_photo FROM users WHERE id = $1',
    [ id],
    (error, results) => {
      if(error)  {
        throw error;
      }

      let data = camelcaseKeys(results.rows);

      let totalElements = results.rows.length;
      let totalPages    = '';
      res.status(200).json({
        success: true,
        data:data,      
      });    
    }
  );
}

const createUser = (req, res) => {   

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Error Occured'
      });
    }
    const { first_name, last_name, email, password, terms_agree,user_role } = req.body; 
    const current_date = new Date();
      pool.query(
        "INSERT INTO users(first_name,last_name,email,password,terms_agree,role_id,date_created) VALUES ($1,$2,$3,$4,$5,$6,$7)",
        [first_name, last_name, email, password, terms_agree, user_role,current_date],(error,results)=>{
        if(error){
          throw error;
        }     
      });
    
      res.status(201).json({
        success: true,
        message: 'User Successfully Registered!',
      }); 
     
}

const getUserDetailsByToken = (req, res) =>{
  let token = req.headers['x-access-token'] || req.headers['authorization']; 
  if (token) {
    if (token.startsWith('Bearer ')) {
      token = token.slice(7, token.length);
    }
    jwt.verify(token, secret, (err, decoded) => {
      if (err) {
        return res.status(200).json({
          success: false,
          message: 'Token is not valid'
        });
      } else {
        req.decoded = decoded;
        if(decoded.username){
          pool.query('SELECT id as user_id,role_id,first_name,last_name,email,phone_number as phone_number, gender, dob,designation,experience, password,terms_agree,profile_photo FROM users WHERE email = $1', [decoded.username], (error, results) => {
            if (error) {
              throw error
            }
            let data = camelcaseKeys(results.rows);
            res.status(200).json(data)
          })
        }else{
          return res.status(400).json({
            success: false,
            message: 'Token is not valid'
          });
        }      
      }
    });
  }else{
    return res.status(400).json({
      success: false,
      message: 'Auth token is not supplied'
    });
  }
}


const updateUser = (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Error Occured'
    });
  }
  let profile_photo   = ''
  const first_name    = req.body.firstName;
  const last_name     = req.body.lastName;
  const email         = req.body.email;
  const phone_number  = req.body.phoneNumber;
  const designation   = req.body.designation;
  const gender        = req.body.gender;
  const dob           = req.body.dob;
  const password      = req.body.password;
  const experience    = req.body.experience;
  const terms_agree   = req.body.termsAgree; 
  const id            = parseInt(req.params.id);
  const current_date  = new Date();

 
  if(req.files!=null){
    const photo         = req.files.photo;
    profile_photo = req.files.photo.name;
    photo.mv('./images/' + profile_photo);
  }else{
    profile_photo = req.body.photo;
  }

    pool.query(
    'UPDATE users SET first_name = $1, last_name = $2,email = $3, phone_number=$4, gender=$5, dob=$6, designation=$7,experience=$8,password=$9,terms_agree=$10,profile_photo=$11,date_modified=$13 WHERE id = $12',
    [first_name, last_name, email, phone_number, gender,dob,designation,experience, password, terms_agree, profile_photo, id, current_date],
    (error, results) => {
      if(error)  {
        res.status(400).json({
          success: true,
          message: `something went wrong`,
        }); 
        throw error;
      }
      res.status(201).json({
        success: true,
        message: `User modified with ID: ${id}`,
      }); 
    }
  );
  
  
   
}

const deleteUser = (req, res) => {

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Error Occured'
    });
  }

  const id = parseInt(req.params.id);
    pool.query('DELETE FROM users WHERE id = $1', [id], (error, results) => {
    if (error) {
      throw error
    }
    if(results){
      res.status(201).json({
        success: true,
        message: `User deleted`,
      }); 
    }
    });

}

const logoutUser = (req, res) =>{
  return res.status(200).json({
    success: true,
    message: `Session cleared`,
  }); 
}


module.exports = {
    HandlerGenerator,
    authenticateToken,
    getUserByUsername,
    getUserDetailsByToken,
    getUsers,
    getUserDetailsById,
    createUser,
    updateUser,
    deleteUser,
    logoutUser
}