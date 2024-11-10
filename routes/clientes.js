const express = require('express')
const pool = require('../config/db');
const router = express.Router()

router.post("/guardar", async (req, res) => {
    try {
        console.log(req.body);
        const nit_cliente = req.body.nit_cliente;
        const nombre = req.body.nombre;
        const apellido = req.body.apellido;
        const direccion = req.body.direccion;
        
        const result = await pool.query(
            'INSERT INTO clientes(nit_cliente, nombre,  apellido, direccion ) VALUES (?, ?, ?, ?)',
            [nit_cliente, nombre, apellido, direccion]
        );
        
        res.status(201).send(`Cliente guardada exitosamente con ID: ${result.insertId}`);
    } 
    catch (error) {
        console.log(`Error al guardar mesa: ${error}`);
        res.status(500).send("Error del servidor");
    }
});


router.get("/listar", async (req, res) => {
    try {
        const [result] = await pool.query("SELECT * FROM clientes");
        
        res.status(200).send(result);

    } catch (error) {
        console.error(`Error al mostrar clientes: ${error}`);
        res.status(500).send("Error del servidor");
    }
});

//Editar
router.put("/actualizar", async (req, res) => {
    console.log(req.body);
    const { id, nit_cliente, nombre, apellido, direccion } = req.body;

    const query = 'UPDATE clientes SET nit_cliente=?, nombre=?, apellido=?, direccion=? WHERE id=?';

    try {
        const [result] = await pool.query(query, [nit_cliente, nombre, apellido, direccion, id]);

        if (result.affectedRows === 0) {
            return res.status(404).send('Cliente no encontrada');
 
        }
        res.status(200).send(`Categoría actualizada exitosamente con ID: ${result.insertId}`);
  
    } catch (err) {
        console.error(`Error al actualizar cliente: ${err}`);
        res.status(500).send("Error del servidor");
    }
});
module.exports = router;