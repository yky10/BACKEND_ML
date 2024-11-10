const express = require('express')
const pool = require('../config/db');
const router = express.Router()

//Falta especificar los errores y validarlos
router.post("/guardar", async (req, res) => {
    try {
        console.log(req.body);
        const numero = req.body.numero;
        const capacidad_max = req.body.capacidad_max;
        
        const result = await pool.query(
            'INSERT INTO mesas(numero, capacidad_max) VALUES (?, ?)',
            [numero, capacidad_max]
        );
        
        res.status(201).send(`Mesa guardada exitosamente con ID: ${result.insertId}`);
    } 
    catch (error) {
        console.log(`Error al guardar mesa: ${error}`);
        res.status(500).send("Error del servidor");
    }
});

//listar
router.get("/listar", async (req, res) => {
    try {
        // Ejecutamos la consulta usando async/await
        const [result] = await pool.query("SELECT * FROM mesas");
        
        // Respuesta estructurada en formato JSON
        res.status(200).send(result);

    } catch (error) {
        console.error(`Error al mostrar mesas: ${error}`);
        res.status(500).send("Error del servidor");
    }
});

//Editar
router.put("/actualizar", async (req, res) => {
    console.log(req.body);
    const { id, numero, capacidad_max } = req.body;

    const query = 'UPDATE mesas SET numero=?, capacidad_max=? WHERE id=?';

    try {
        // Ejecutar la consulta usando async/await
        const [result] = await pool.query(query, [numero, capacidad_max, id]);

        // Verificar si se actualizó algún registro
        if (result.affectedRows === 0) {
            return res.status(404).send('Mesa no encontrada');
 
        }

        // Enviar respuesta con el resultado de la actualización
        res.status(200).send(`Mesa actualizada exitosamente con ID: ${result.insertId}`);
  
    } catch (err) {
        console.error(`Error al actualizar mesa: ${err}`);
        res.status(500).send("Error del servidor");
    }
});

//eliminar //No funciona el de eliminar MESA

router.delete("/eliminar/:id", async (req, res) => {
    const id = req.params.id;

    const query = 'DELETE FROM mesas WHERE id = ?';

    try {
        // Ejecutar la consulta usando async/await
        const [result] = await pool.query(query, [id]);

        // Verificar si se eliminó algún registro
        if (result.affectedRows === 0) {
            return res.status(404).send('Mesa no encontrada');
   
        }

        // Enviar respuesta de éxito
        res.status(200).send("Mesa eliminada con éxito.");
   
    } catch (err) {
        console.error(`Error al eliminar mesa: ${err}`);
        res.status(500).send("Error en el servidor");
    }
});
module.exports = router;