const express = require('express')
const pool = require('../config/db'); //importamos la bd
const router = express.Router();

//Tabla Persona - Empleado actualmente
router.post("/create", async (req, res) => {
    console.log(req.body);
    const {
        primer_nombre,
        segundo_nombre,
        primer_apellido,
        segundo_apellido,
        telefono,
        email
    } = req.body;

    const query = 'INSERT INTO persona(primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, telefono, email) VALUES (?, ?, ?, ?, ?, ?)';

    try {
        // Ejecutar la consulta usando async/await
        const [result] = await pool.query(query, [primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, telefono, email]);
        
        // Enviar respuesta con el resultado de la inserción
        res.status(201).send(`Empleado guardada exitosamente con ID: ${result.insertId}`);
    } catch (err) {
        console.error(`Error al crear persona: ${err}`);
        res.status(500).send("Error del servidor");
    }
});

/*Consulta que se muestra en la tabla de empleados.  */
router.get("/obtenerlistapersonas", async (req, res) => {
    try {
        // Ejecutamos la consulta usando async/await
        const [result] = await pool.query("SELECT * FROM PERSONA");
        
        // Enviar respuesta con los resultados
        res.status(200).send(result);

    } catch (error) {
        console.error(`Error al obtener la lista de personas: ${error}`);
        res.status(500).send("Error del servidor");
    }
});

//Update
router.put("/update", async (req, res) => {
    console.log(req.body);
    const {
        id,
        primer_nombre,
        segundo_nombre,
        primer_apellido,
        segundo_apellido,
        telefono,
        email
    } = req.body;

    const query = 'UPDATE persona SET primer_nombre=?, segundo_nombre=?, primer_apellido=?, segundo_apellido=?, telefono=?, email=? WHERE id=?';

    try {
        // Ejecutar la consulta usando async/await
        const [result] = await pool.query(query, [primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, telefono, email, id]);

        // Verificar si se actualizó algún registro
        if (result.affectedRows === 0) {
            return res.status(404).send('Persona no encontrada');
        }

        // Enviar respuesta con el resultado de la actualización
        res.status(200).send("Persona actualizada con éxito.");
    } catch (err) {
        console.error(`Error al actualizar persona: ${err}`);
        res.status(500).send("Error en el servidor");
    }
});

module.exports = router;