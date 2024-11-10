const express = require('express')
const pool = require('../config/db');
const router = express.Router();

router.get("/listar", async (req, res) => {
    try {
        // Ejecutar la consulta usando el pool directamente
        const [result] = await pool.query("SELECT * FROM detalles_orden");
        
        // Enviar respuesta con los resultados
        res.status(200).json(result);
    } catch (err) {
        console.error(`Error al mostrar detalle de ordenes: ${err}`);
        res.status(500).send('Error al mostrar detalle de ordenes');
    }
});

router.post("/guardar", async (req, res) => {
    try {
        const { orden_id, platillo_id, cantidad } = req.body;
        console.log(req.body);

        // Obtener precio del platillo
        const [platilloResult] = await pool.query(
            'SELECT precio FROM platillos WHERE id = ?',
            [platillo_id]
        );

        if (platilloResult.length === 0) {
            return res.status(404).send('Platillo no encontrado');
        }

        const precio = platilloResult[0].precio;
        const subtotal = precio * cantidad;

        // Insertar detalle de orden
        const [detalleResult] = await pool.query(
            'INSERT INTO detalles_orden(orden_id, platillo_id, cantidad, subtotal) VALUES (?, ?, ?, ?)',
            [orden_id, platillo_id, cantidad, subtotal]
        );

        // Calcular nuevo total
        const [totalResult] = await pool.query(
            'SELECT COALESCE(SUM(subtotal), 0) as total FROM detalles_orden WHERE orden_id = ?',
            [orden_id]
        );

        const nuevoTotal = totalResult[0].total;

        // Actualizar total de la orden
        await pool.query(
            'UPDATE ordenes SET total = ? WHERE id = ?',
            [nuevoTotal, orden_id]
        );
        res.status(201).send(`Detalle orden guardada exitosamente con ID: ${detalleResult.insertId}`);
    } 
    catch (error) {
        console.error(`Error al guardar detalle orden: ${error}`); 
        res.status(500).send("Error al guardar detalle orden");
    }
});

router.put("/actualizar/:id", async (req, res) => {
    const detalleId = req.params.id;
    const { cantidad } = req.body;

    try {
        // Primero obtenemos el platillo_id y orden_id del detalle
        const [detalleResult] = await pool.query(
            'SELECT platillo_id, orden_id FROM detalles_orden WHERE id = ?',
            [detalleId]
        );

        if (detalleResult.length === 0) {
            return res.status(404).send('Detalle no encontrado');
        }

        const { platillo_id, orden_id } = detalleResult[0];

        // Obtenemos el precio del platillo
        const [platilloResult] = await pool.query(
            'SELECT precio FROM platillos WHERE id = ?',
            [platillo_id]
        );

        if (platilloResult.length === 0) {
            return res.status(404).send('Platillo no encontrado');
        }

        const precio = platilloResult[0].precio;
        const subtotal = precio * cantidad;

        // Actualizamos el detalle con la nueva cantidad y subtotal
        await pool.query(
            'UPDATE detalles_orden SET cantidad = ?, subtotal = ? WHERE id = ?',
            [cantidad, subtotal, detalleId]
        );

        // Recalculamos el total de la orden
        const [totalResult] = await pool.query(
            'SELECT SUM(subtotal) as total FROM detalles_orden WHERE orden_id = ?',
            [orden_id]
        );

        const nuevoTotal = totalResult[0].total || 0;

        // Actualizamos el total de la orden
        await pool.query(
            'UPDATE ordenes SET total = ? WHERE id = ?',
            [nuevoTotal, orden_id]
        );

        res.json({
            message: 'Detalle orden actualizado exitosamente',
            detalleId: detalleId,
            nuevaCantidad: cantidad,
            nuevoSubtotal: subtotal,
            nuevoTotal: nuevoTotal
        });

    } catch (err) {
        console.error(`Error al actualizar detalle: ${err}`);
        res.status(500).send('Error al actualizar detalle');
    }
});

// Eliminar detalle_orden
router.delete("/eliminar/:ordenId/:platilloId", async (req, res) => {
    const ordenId = req.params.ordenId; // id de la orden
    const platilloId = req.params.platilloId; // id del platillo a eliminar

    try {
        // 1. Obtener el detalle del platillo antes de eliminar
        const [detalleResult] = await pool.query(
            'SELECT id FROM detalles_orden WHERE orden_id = ? AND platillo_id = ?',
            [ordenId, platilloId]
        );

        // Verificar que se encontró el detalle
        if (!detalleResult || detalleResult.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Detalle de orden no encontrado"
            });
        }

        const detalleId = detalleResult[0].id; // id del detalle encontrado

        // 2. Eliminar el detalle
        await pool.query(
            'DELETE FROM detalles_orden WHERE id = ?',
            [detalleId]
        );

        // 3. Recalcular el total
        const [totalResult] = await pool.query(
            'SELECT COALESCE(SUM(subtotal), 0) as total FROM detalles_orden WHERE orden_id = ?',
            [ordenId]
        );

        const nuevoTotal = totalResult[0].total;

        // 4. Actualizar el total en la orden
        await pool.query(
            'UPDATE ordenes SET total = ? WHERE id = ?',
            [nuevoTotal, ordenId]
        );

        // 5. Enviar respuesta exitosa
        res.status(200).json({
            success: true,
            message: "Detalle de orden eliminado con éxito",
            data: {
                detalleId: detalleId,
                ordenId: ordenId,
                nuevoTotal: nuevoTotal
            }
        });

    } catch (error) {
        console.error('Error en la eliminación del detalle:', error);
        res.status(500).json({
            success: false,
            message: "Error al procesar la solicitud",
            error: error.message
        });
    }
});

module.exports = router;