
const pool                 = require('../config/db.js');
let jwt                    = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const camelcaseKeys        = require('camelcase-keys');

let secret = process.env.JWT_SECRET;

const getProjects= (req, res)=>{
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
          "SELECT * FROM projects ORDER BY id ASC", 
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

const getProjectDetailsById = (req, res) => {

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Error Occured'
    });
  }
  const id = parseInt(req.params.id);
    pool.query(
    'SELECT id as project_id,project_name,project_description,client,team_leader,status,date_created FROM projects WHERE id = $1',
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

const createProject = (req, res) => {   

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Error Occured'
      });
    }

    const project_name        = req.body.projectName;
    const project_description = req.body.projectDescription;
    const client              = req.body.clientCompany;
    const team_leader         = req.body.projectLeader;
    const status              = req.body.projectStatus;

    const current_date = new Date();
      pool.query(
        "INSERT INTO projects(project_name,project_description,client,team_leader,status,date_created) VALUES ($1,$2,$3,$4,$5,$6)",
        [project_name, project_description, client, team_leader, status, current_date],(error,results)=>{
        if(error){
          throw error;
        }     
      });
    
      res.status(201).json({
        success: true,
        message: 'User Successfully Registered!',
      }); 
     
}


const updateProject = (req, res) => {
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

const deleteProject = (req, res) => {

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Error Occured'
    });
  }

  const id = parseInt(req.params.id);
    pool.query('DELETE FROM projects WHERE id = $1', [id], (error, results) => {
    if (error) {
      throw error
    }
    if(results){
      res.status(201).json({
        success: true,
        message: `Project deleted`,
      }); 
    }
    });

}


module.exports = {  
    getProjects,
    getProjectDetailsById,
    createProject,
    updateProject,
    deleteProject
}