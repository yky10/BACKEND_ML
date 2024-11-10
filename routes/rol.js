const express = require('express')
const pool = require('../config/db'); //importamos la bd
const router = express.Router();

router.get("/obtenerrol", async (req, res) => {
    try {
        // Ejecutamos la consulta usando async/await
        const [result] = await pool.query("SELECT id_rol, nombre FROM rol");
        
        // Enviar respuesta con los resultados
        res.status(200).send(result);
    } catch (error) {
        console.error(`Error al obtener roles: ${err}`);
        res.status(500).send("Error del servidor");
    }
});

router.post("/crearrol", async (req, res) => {
    const { nombre } = req.body;

    try {
        // Verificar si el rol ya existe
        const [existingRole] = await pool.query('SELECT * FROM rol WHERE nombre = ?', [nombre]);

        if (existingRole.length > 0) {
            return res.status(400).send("El rol ya existe.");
        }

        // Insertar el nuevo rol
        const [result] = await pool.query('INSERT INTO rol (nombre) VALUES (?)', [nombre]);

        // Enviar respuesta de éxito
        res.status(201).send(`Rol creado exitosamente con ID: ${result.insertId}`);
    } catch (error) {
        console.error(`Error al crear rol: ${error}`);
        res.status(500).send("Error del servidor");
    }
});

router.put("/actualizarrol/:id", async (req, res) => {
    const rolId = req.params.id; // ID del rol a actualizar
    const { nombre } = req.body;

    try {
        // Verificar si el rol existe
        const [existingRole] = await pool.query('SELECT * FROM rol WHERE id_rol = ?', [rolId]);

        if (existingRole.length === 0) {
            return res.status(404).send("Rol no encontrado.");
        }

        // Actualizar el nombre del rol
        await pool.query('UPDATE rol SET nombre = ? WHERE id_rol = ?', [nombre, rolId]);

        // Enviar respuesta de éxito
        res.status(200).send("Rol actualizado exitosamente.");
    } catch (error) {
        console.error(`Error al actualizar rol: ${error}`);
        res.status(500).send("Error del servidor");
    }
});

router.delete("/eliminarrol/:id", async (req, res) => {
    const rolId = req.params.id; // ID del rol a eliminar

    try {
        // Verificar si el rol existe
        const [existingRole] = await pool.query('SELECT * FROM rol WHERE id_rol = ?', [rolId]);

        if (existingRole.length === 0) {
            return res.status(404).send("Rol no encontrado.");
        }

        // Eliminar el rol
        await pool.query('DELETE FROM rol WHERE id_rol = ?', [rolId]);

        // Enviar respuesta de éxito
        res.status(200).send("Rol eliminado exitosamente.");
    } catch (error) {
        console.error(`Error al eliminar rol: ${error}`);
        res.status(500).send("Error del servidor");
    }
});

module.exports = router;