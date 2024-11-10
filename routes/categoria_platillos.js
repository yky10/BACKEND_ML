const express = require('express')
const pool = require('../config/db'); //importamos la bd
const router = express.Router();

router.post("/guardar", async (req, res) => {
    console.log(req.body);
    const nombre = req.body.nombre;

    const query = 'INSERT INTO categorias_platillos(nombre) VALUES (?)';

    try {
        // Ejecutar la consulta directamente con el pool
        const [result] = await pool.query(query, [nombre]);

        res.status(201).send(`Categoría guardada exitosamente con ID: ${result.insertId}`);
    } catch (err) {
        console.error(`Error al guardar categoría: ${err}`);
        res.status(500).send("Error del servidor");
    }
});

//listar
router.get("/listar", async (req, res) => {
    try {
        // Ejecutar la consulta para listar categorías
        const [result] = await pool.query("SELECT * FROM categorias_platillos");
        
        res.status(200).send(result);
    } catch (err) {
        console.error(`Error al mostrar categorías de platillos: ${err}`);
        res.status(500).send("Error del servidor");
    }
});

//Editar 
router.put("/actualizar", async (req, res) => {
    console.log(req.body);
    const { id, nombre } = req.body;

    const query = 'UPDATE categorias_platillos SET nombre=? WHERE id=?';

    try {
        // Ejecutar la consulta usando async/await
        const [result] = await pool.query(query, [nombre, id]);

        // Verificar si se actualizó algún registro
        if (result.affectedRows === 0) {
            return res.status(404).send('Categoría no encontrada');
        }

        // Enviar respuesta con el resultado de la actualización
        res.status(200).send(`Categoría actualizada exitosamente con ID: ${result.insertId}`);
    } catch (err) {
        console.error(`Error al actualizar categoría: ${err}`);
        res.status(500).send("Error del servidor");
    }
});

//eliminar
router.delete("/eliminar/:id", async (req, res) => {
    const id = req.params.id;

    try {
        // Primero, verificar si la categorias_platillos tiene platillos asociados
        const [platillos] = await pool.query('SELECT * FROM platillos WHERE categoria_id = ?', [id]);

        // Si hay platillos asociados, no permitir la eliminación
        if (platillos.length > 0) {
            return res.status(400).send("No se puede eliminar la categoría porque tiene platillos asociados.");
        }

        // Si no hay platillos asociados, proceder a eliminar la categoría
        await pool.query('DELETE FROM categorias_platillos WHERE id = ?', [id]);

        // Enviar respuesta de éxito
        res.status(200).send("Categoría eliminada con éxito.");
    } catch (err) {
        console.error(`Error al eliminar categoría: ${err}`);
        res.status(500).send("Error en el servidor");
    }
});

module.exports = router;