const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db'); 
const router = express.Router();


router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    const query = `
        SELECT u.*, r.nombre AS rol_nombre, e.descripcion AS estado_descripcion, GROUP_CONCAT(p.nombre) AS permisos
        FROM usuarios u 
        JOIN rol r ON u.rol_id = r.id_rol 
        JOIN estado_usuario e ON u.estado_id = e.id_estado 
        LEFT JOIN rol_permisos rp ON r.id_rol = rp.rol_id
        LEFT JOIN permisos p ON rp.permiso_id = p.id_permiso
        WHERE u.username = ?
        GROUP BY u.id_usuario;
    `;

    let connection; // Declarar la variable de conexión

    try {
        // Obtener una conexión del pool
        connection = await pool.getConnection();
        
        // Ejecutar la consulta
        const [results] = await connection.query(query, [username]);

        if (results.length === 0) {
            return res.status(400).json({ message: "Usuario no encontrado" });
        }

        const user = results[0];
        console.log('User found:', { ...user, password: '[REDACTED]' });

        if (user.estado_descripcion.toLowerCase() !== 'activo') {
            return res.status(403).json({ message: "Usuario inactivo" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            return res.status(400).json({ message: "Credenciales inválidas" });
        }

        // La creación del token
        const payload = {
            user: {
                id_usuario: user.id_usuario,
                id_persona: user.id_persona,
                username: user.username,
                rol_id: user.rol_id,
                rol_nombre: user.rol_nombre,
                estado_id: user.estado_id,
                estado_descripcion: user.estado_descripcion, 
                roles: [user.rol_nombre], 
                permissions: user.permisos ? user.permisos.split(',') : [] 
            }
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
        
        res.json({ token, user: payload.user });

    } catch (err) {
        console.error('Error:', err);
        return res.status(500).json({ message: "Error del servidor", error: err.message });
    } finally {
        // Liberar la conexión de vuelta al pool
        if (connection) connection.release();
    }
});

module.exports = router;