const express = require('express')
const db = require('../config/db'); //importamos la bd
const router = express.Router();

router.post('/login', (req, res) => {
    const sql = "SELECT * FROM usuarios WHERE username = ? AND password = ?";
    db.query(sql, [req.body.username, req.body.password], (err, data) => {
        if (err) {
            return res.status(500).json({ success: false, message: "Error en el servidor" });
        }

        if (data.length > 0) {
            // Usuario encontrado, login exitoso
            return res.status(200).json({ success: true, message: "Inicio de sesión correcto" });
        } else {
            // Usuario no encontrado o contraseña incorrecta
            return res.status(401).json({ success: false, message: "Usuario o contraseña incorrectos" });
        }
    });
});


module.exports = router;