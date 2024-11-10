const express = require('express')
const pool = require('../config/db'); //importamos la bd
const router = express.Router();

router.get("/obtenerestado", async (req, res) => {
    try {
        // Ejecutamos la consulta usando async/await
        const [result] = await pool.query("SELECT id_estado, estado, descripcion FROM estado_usuario");
        
        // Enviar respuesta con los resultados
        res.status(200).send(result);
        
    } catch (error) {
       // console.error(`Error al obtener estados: ${err}`);
        res.status(500).send("Error del servidor");
    }
});

module.exports = router;