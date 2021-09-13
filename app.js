const express = require('express');
const multer = require('multer');

require('./db/mongoose');
const userRouter = require('./routes/user');
const taskRouter = require('./routes/task');

const app = express();
const port = process.env.PORT;

// const upload = multer({
//     dest: 'images'
// });

app.use(express.json());

app.use(userRouter);
app.use(taskRouter);

app.use((error, req, res, next) => {
    res.status(400).send({ error: error.message });
});

app.listen(port, () => {
    console.log('Server is up on port ' + port);
});