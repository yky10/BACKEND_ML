const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'restauranteml',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool;

//const mysql = require('mysql2')
/*const mysql = require('mysql2/promise');

const db = mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'',
    database: 'restauranteml'
});

db.connect(err => {
    if (err) {
        console.error('Error al conectar con la base de datos restauranteml:', err);
        return;
    }
    console.log('Base de datos conectado!');
});

module.exports = db;
*/