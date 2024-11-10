const express = require('express');
const pool = require('../config/db'); 
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Ruta para guardar un platillo con imagen
router.post("/guardar", upload.single('imagen'), async (req, res) => {
    const { nombre, descripcion, categoria_id, precio } = req.body;
    const imagen = req.file ? req.file.filename : null; // Nombre del archivo de imagen, si se subió una

    const query = 'INSERT INTO platillos(nombre, descripcion, categoria_id, precio, imagen) VALUES (?, ?, ?, ?, ?)';

    try {
        // Ejecutar la consulta usando async/await
        const [result] = await pool.query(query, [nombre, descripcion, categoria_id, precio, imagen]);

        // Enviar respuesta con el resultado de la inserción
        res.status(201).send(`Platillo guardado exitosamente con ID: ${result.insertId}`);
    } catch (err) {
        console.error(`Error al guardar Platillo: ${err}`);
        res.status(500).send("Error del servidor");
    }
});

// Ruta para listar los platillos
router.get("/listar", async (req, res) => {
    try {
        const [result] = await pool.query("SELECT * FROM platillos");
        res.status(200).send(result);
    } catch (error) {
        console.error(`Error al mostrar listado de platillos: ${error}`);
        res.status(500).send("Error del servidor");
    }
});

// Ruta para actualizar un platillo
router.put("/actualizar", upload.single('imagen'), async (req, res) => {
    const { id, nombre, descripcion, categoria_id, precio } = req.body;
    const imagen = req.file ? req.file.filename : null; // Nombre de la nueva imagen, si se sube

    let query = 'UPDATE platillos SET nombre=?, descripcion=?, categoria_id=?, precio=? WHERE id=?';
    let params = [nombre, descripcion, categoria_id, precio, id];

    if (imagen) {
        query = 'UPDATE platillos SET nombre=?, descripcion=?, categoria_id=?, precio=?, imagen=? WHERE id=?';
        params = [nombre, descripcion, categoria_id, precio, imagen, id];
    }

    try {
        const [result] = await pool.query(query, params);

        if (result.affectedRows === 0) {
            return res.status(404).send('Platillo no encontrado');
        }

        res.status(200).send(`Platillo actualizado exitosamente con ID: ${id}`);
    } catch (err) {
        console.error(`Error al actualizar Platillo: ${err}`);
        res.status(500).send("Error del servidor");
    }
});

// Ruta para eliminar un platillo
router.delete("/eliminar/:id", async (req, res) => {
    const id = req.params.id;

    const query = 'DELETE FROM platillos WHERE id = ?';

    try {
        const [result] = await pool.query(query, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Platillo no encontrado'
            });
        }

        res.status(200).send("Platillo eliminado con éxito.");
    } catch (err) {
        console.error(`Error al eliminar Platillo: ${err}`);
        res.status(500).send("Error del servidor");
    }
});

module.exports = router;
