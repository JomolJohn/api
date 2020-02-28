require('dotenv').config();

var cors         = require('cors');
const express    = require('express');
const bodyParser = require('body-parser');
const app        = express();
let fileUpload   = require('express-fileupload');
var path         = require('path');

app.use(cors());
app.use(fileUpload({
  createParentPath: true
}));
app.use(express.static(path.join(__dirname, 'images')));

const user         = require('./user/queries');
const project      = require('./projects/projects');

const port       = process.env.PORT;

let http = require('http');
let server = http.Server(app);

let socketIO = require('socket.io');
let io = socketIO(server);

io.on('connection', (socket) => {
    console.log('user connected');
    socket.on('new-message', (message) => {
      console.log(message);
      io.emit('new-message', message);
    });
});


function main() {

  let handlers = new user.HandlerGenerator();

  app.use(bodyParser.json());

  app.use(
    bodyParser.urlencoded({
      extended: true,
    })
  );  

  //user 
  app.get('/', handlers.index);  
  app.post('/user/login', handlers.login);
  app.post('/user/logout', user.logoutUser);

  app.get('/user/authenticate', user.authenticateToken)
  app.get('/users', user.getUsers)
  app.get('/user/id/:id', user.getUserDetailsById)
  app.get('/user/:username', user.getUserByUsername)
  app.get('/accounts/user', user.getUserDetailsByToken)
  app.post('/user/add', user.createUser)
  app.put('/user/edit/:id', user.updateUser)
  app.delete('/user/delete/:id', user.deleteUser)

  //projects
  app.get('/projects', project.getProjects)
  app.get('/project/id/:id', project.getProjectDetailsById)
  app.post('/project/add', project.createProject)
  app.put('/project/edit/:id', project.updateProject)
  app.delete('/project/delete/:id', project.deleteProject)
  
  server.listen(port, () => {
    console.log(`App running on port ${port}.`)
  });

  module.exports = app;
  
}
main();