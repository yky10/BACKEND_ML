const express = require('express')
const pool = require('../config/db'); //importamos la bd
const router = express.Router();

router.post("/guardar", async (req, res) => {
    const nombre = req.body.nombre;
    const query = 'INSERT INTO categorias_platillos(nombre) VALUES (?)';

    try {
        const [result] = await pool.query(query, [nombre]);
        console.log("Categoría guardada exitosamente con ID:", result.insertId);
        res.status(201).json({ message: `Categoría guardada exitosamente con ID: ${result.insertId}` });
    } catch (err) {
        // Manejo de errores específico
        if (err.code === 'ER_DUP_ENTRY') {
            // Error de clave duplicada
            console.error("Error: El nombre de la categoría ya existe.");
            res.status(409).json({ error: "El nombre de la categoría ya existe. Por favor, elige otro nombre." });
        } else if (err.code === 'ER_BAD_DB_ERROR') {
            // Error de base de datos no existente
            console.error("Error: La base de datos no existe.");
            res.status(500).json({ error: "La base de datos no existe. Por favor, verifica la configuración." });
        } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
            // Error de permisos o acceso denegado
            console.error("Error: Acceso denegado a la base de datos.");
            res.status(500).json({ error: "Acceso denegado. Verifica las credenciales de la base de datos." });
        } else {
            // Otros errores no específicos
            console.error("Error desconocido al guardar categoría.");
            res.status(500).json({ error: "Error del servidor. No se pudo guardar la categoría." });
        }
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