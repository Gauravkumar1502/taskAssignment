import express from 'express';
import cors from 'cors';
import mysql from 'mysql2';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

const app = express();
const PORT = 8080;
app.use(cors());
app.use(bodyParser.json());
dotenv.config();

// set values from .env file
const connection = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT || 3306
});

// if connection is successful
connection.connect((err) => {
    if (err) {
        console.error('Connection to database failed: ');
        process.exit(1);
    } else {
        console.log('Successfully connected to database!');
    }
});

// create table if it doesn't exist
const createTaskTableQuery = `CREATE TABLE IF NOT EXISTS Task (
    task_number VARCHAR(10) PRIMARY KEY,
    actual_hours DECIMAL(4, 2),
    notes TEXT,
    completed BOOLEAN DEFAULT FALSE
);`;

const createTaskEstimateTableQuery = `CREATE TABLE IF NOT EXISTS TaskEstimate (
    task_number VARCHAR(10),
    time_estimate DECIMAL(4, 2) NOT NULL,
    estimate_notes TEXT,
    FOREIGN KEY (task_number) REFERENCES Task(task_number)
);`;

// create task table
connection.query(createTaskTableQuery, (err, result) => {
    if (err) throw err;
    if (result.warningStatus === 0)
        console.log('Task table created successfully!');
    else
        console.log('Task table already exists!');
});

// create task estimate table
connection.query(createTaskEstimateTableQuery, (err, result) => {
    if (err) throw err;
    if (result.warningStatus === 0)
        console.log('Task estimate table created successfully!');
    else
        console.log('Task estimate table already exists!');
});

app.get('/greeter', (req, res) => {
    res.send('Hello World!');
});

// save a task as draft
app.post('/newdraft', (req, res) => {
    const { taskNumber, estTime, estNote } = req.body;
    const query = `INSERT INTO Task (task_number) VALUES (?);`;
    const query1 = `INSERT INTO TaskEstimate (task_number, time_estimate, estimate_notes) VALUES (?, ?, ?);`;
    connection.query(query, [taskNumber], (err, resultTask) => {
        if (err){
            return res.status(500).send(err.message);
        }
        connection.query(query1, [taskNumber, estTime, estNote], (errTaskEstimate, resultTaskEstimate) => {
            if (errTaskEstimate) 
                return res.status(500).send(errTaskEstimate.message);
            res.status(200).send('Task added successfully!');
        });    
    });
});

// update a task as draft (add estimate time and note)
app.post('/draft', (req, res) => {
    const { taskNumber, updteEstTime, estNote } = req.body;
    const query = "Insert into TaskEstimate values (?, ?, ?);";
    connection.query(query, [taskNumber, updteEstTime, estNote], (err, result) => {
        if (err)
            return res.status(500).send(err.message);
        res.status(200).send('Task updated successfully!');
    });
});

// save a task as final
app.post('/final', (req, res) => {
    const {taskNumber, estTime, estNote, actHours, finalNote} = req.body;
    const query = `INSERT INTO Task VALUES (?, ?, ?, ?);`;
    const query1 = `INSERT INTO TaskEstimate VALUES (?, ?, ?);`;
    connection.query(query, [taskNumber, actHours, finalNote, "1"], (err, resultTask) => {
        if (err)
            return res.status(500).send(err.message);
        
        connection.query(query1, [taskNumber, estTime, estNote], (errTaskEstimate, resultTaskEstimate) => {
            if (errTaskEstimate)
                return res.status(500).send(errTaskEstimate.message);
            res.status(200).send('Task added successfully!');
        });
    });
});

// get task by task number
app.get('/task/:taskNumber', (req, res) => {
    const { taskNumber } = req.params;
    const query = `
    SELECT * FROM Task LEFT JOIN TaskEstimate 
    ON Task.task_number = TaskEstimate.task_number
    where Task.task_number = ?;`;
    connection.query(query, [taskNumber], (err, result) => {
        if (err)
            return res.status(500).send(err.message);
        res.status(200).send(result);
    });
});



app.listen(PORT, () => {
    console.log(`Server listening on port http://localhost:${PORT}`);
});