import mysql from 'mysql';

const connection = mysql.createConnection({
    host: 'localhost',
    database: 'tasks',
    user: 'root',
    password: 'G@urav',
});

connection.connect((err) => {
    if (err) throw err;
    console.log('Connected!');
});