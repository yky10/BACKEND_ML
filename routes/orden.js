const express = require('express')
const pool = require('../config/db'); //importamos la bd
const router = express.Router();

router.get("/listar", async (req, res) => {
    try {
        // Ejecutamos la consulta usando async/await
        const [result] = await pool.query("SELECT * FROM ordenes");
        
        // Enviar respuesta con los resultados
        res.status(200).json(result);
    } catch (error) {
        console.error(`Error al mostrar órdenes: ${error}`);
        res.status(500).send("Error del servidor");
    }
});

router.post("/guardar", async (req, res) => {
    console.log(req.body);
    const { id_usuario, mesa_id } = req.body;
    const total = 0;
    const estado = 'pendiente';

    const query = 'INSERT INTO ordenes(id_usuario, mesa_id, fecha_orden, total, estado) VALUES (?, ?, NOW(), ?, ?)';

    try {
        // Ejecutar la consulta usando async/await
        const [result] = await pool.query(query, [id_usuario, mesa_id, total, estado]);
        
        // Enviar respuesta con el resultado de la inserción
        res.status(201).json({ ordenId: result.insertId }); // Enviar el ID de la orden en formato JSON
    } catch (err) {
        console.error(`Error al crear orden: ${err}`);
        res.status(500).send("Error del servidor");
    }
});


/*

router.post("/enviar-orden/:id", async (req, res) => {
    const ordenId = req.params.id;

    const query = 'UPDATE ordenes SET estado = "preparando" WHERE id = ?';

    try {
        // Ejecutar la consulta usando async/await
        const [result] = await pool.query(query, [ordenId]);

        // Verificar si se actualizó algún registro
        if (result.affectedRows === 0) {
            return res.status(404).send('Orden no encontrada');
        }

        // Enviar respuesta con el resultado de la actualización
        res.status(200).json({
            success: true,
            message: 'Orden enviada exitosamente',
            ordenId: ordenId,
            estado: 'preparando'
        });
    } catch (err) {
        console.error(`Error al enviar orden: ${err}`);
        res.status(500).send("Error al enviar orden");
    }
});


router.post("/responder-orden/:id", async (req, res) => {
    const ordenId = req.params.id;

    const query = 'UPDATE ordenes SET estado = "listo" WHERE id = ?';

    try {
        // Ejecutar la consulta usando async/await
        const [result] = await pool.query(query, [ordenId]);

        // Verificar si se actualizó algún registro
        if (result.affectedRows === 0) {
            return res.status(404).send('Orden no encontrada');
        }

        // Enviar respuesta con el resultado de la actualización
        res.status(200).json({
            success: true,
            message: 'Orden enviada exitosamente',
            ordenId: ordenId,
            estado: 'listo'
        });
    } catch (err) {
        console.error(`Error al responedr orden: ${err}`);
        res.status(500).send("Error al  orden");
    }
});

router.post("/entregar-orden/:id", async (req, res) => {
    const ordenId = req.params.id;

    const query = 'UPDATE ordenes SET estado = "entregado" WHERE id = ?';

    try {
        // Ejecutar la consulta usando async/await
        const [result] = await pool.query(query, [ordenId]);

        // Verificar si se actualizó algún registro
        if (result.affectedRows === 0) {
            return res.status(404).send('Orden no encontrada');
        }

        // Enviar respuesta con el resultado de la actualización
        res.status(200).json({
            success: true,
            message: 'Orden enviada exitosamente',
            ordenId: ordenId,
            estado: 'entregado'
        });
    } catch (err) {
        console.error(`Error al responedr orden: ${err}`);
        res.status(500).send("Error al  orden");
    }
});
*/


//Ejemplo usando Socket aun no probado
/*
router.post("/enviar-orden/:id", (req, res) => {
    const ordenId = req.params.id;
    db.query(
        'UPDATE ordenes SET estado = "preparando" WHERE id = ?',
        [ordenId],
        (err, result) => {
            if (err) {
                console.log(`Error al enviar orden: ${err}`);
                return res.status(500).send('Error al enviar orden');
            }

            // Emitir evento a los clientes conectados
            io.emit('ordenActualizada', {
                ordenId: ordenId,
                estado: 'preparando'
            });

            res.status(200).json({
                message: 'Orden enviada exitosamente',
                ordenId: ordenId,
                estado: 'preparando'
            });
        }
    );
});
*/
/*Orden resperada */

router.post("/enviar-orden/:id", async (req, res) => {
    const ordenId = req.params.id;

    // Verificar el estado actual de la orden
    const estadoQuery = 'SELECT estado FROM ordenes WHERE id = ?';
    try {
        const [orden] = await pool.query(estadoQuery, [ordenId]);
        
        if (orden.length === 0) {
            return res.status(404).send('Orden no encontrada');
        }

        const estadoActual = orden[0].estado;
        if (estadoActual !== 'pendiente') {
            return res.status(400).send('La orden debe estar en estado "pendiente" para ser enviada');
        }

        // Actualizar el estado a "preparando"
        const query = 'UPDATE ordenes SET estado = "preparando" WHERE id = ?';
        const [result] = await pool.query(query, [ordenId]);

        res.status(200).json({
            success: true,
            message: 'Orden enviada exitosamente',
            ordenId: ordenId,
            estado: 'preparando'
        });
    } catch (err) {
        console.error(`Error al enviar orden: ${err}`);
        res.status(500).send("Error al enviar orden");
    }
});



// Obtener órdenes en estado "Preparando" con detalles de cada platillo
router.get("/ordenes-preparando", async (req, res) => {
    try {
        const query = `
            SELECT o.id AS ordenId, o.id_usuario, o.mesa_id, o.fecha_orden, o.total, o.estado,
                d.id AS detalleId, d.platillo_id, d.cantidad, d.subtotal,
                p.nombre AS nombrePlatillo
            FROM ordenes o
            JOIN detalles_orden d ON o.id = d.orden_id
            JOIN platillos p ON d.platillo_id = p.id
            WHERE o.estado = 'preparando'
            ORDER BY o.id, d.id;
        `;

        const [result] = await pool.query(query);

        // Reestructurar los datos para agrupar los detalles de cada orden
        const ordenes = result.reduce((acc, row) => {
            let orden = acc.find(o => o.ordenId === row.ordenId);
            if (!orden) {
                orden = {
                    ordenId: row.ordenId,
                    usuarioId: row.id_usuario,
                    mesaId: row.mesa_id,
                    fechaOrden: row.fecha_orden,
                    total: row.total,
                    estado: row.estado,
                    items: []
                };
                acc.push(orden);
            }

            orden.items.push({
                detalleId: row.detalleId,
                platilloId: row.platillo_id,
                nombre: row.nombrePlatillo,
                cantidad: row.cantidad,
                subtotal: row.subtotal
            });

            return acc;
        }, []);

        res.status(200).json({
            success: true,
            ordenes
        });
    } catch (error) {
        console.error("Error al obtener órdenes en estado 'Preparando':", error);
        res.status(500).json({
            success: false,
            message: "Error al obtener órdenes",
            error: error.message
        });
    }
});

router.post("/responder-orden/:id", async (req, res) => {
    const ordenId = req.params.id;

    // Verificar el estado actual de la orden
    const estadoQuery = 'SELECT estado FROM ordenes WHERE id = ?';
    try {
        const [orden] = await pool.query(estadoQuery, [ordenId]);
        
        if (orden.length === 0) {
            return res.status(404).send('Orden no encontrada');
        }

        const estadoActual = orden[0].estado;
        if (estadoActual !== 'preparando') {
            return res.status(400).send('La orden debe estar en estado "preparando" para ser respondida');
        }

        // Actualizar el estado a "listo"
        const query = 'UPDATE ordenes SET estado = "listo" WHERE id = ?';
        const [result] = await pool.query(query, [ordenId]);

        res.status(200).json({
            success: true,
            message: 'Orden lista exitosamente',
            ordenId: ordenId,
            estado: 'listo'
        });
    } catch (err) {
        console.error(`Error al responder orden: ${err}`);
        res.status(500).send("Error al responder orden");
    }
});

// Obtener órdenes en estado "Listo" con detalles de cada platillo
router.get("/ordenes-listo", async (req, res) => {
    try {
        const query = `
            SELECT o.id AS ordenId, o.id_usuario, o.mesa_id, o.fecha_orden, o.total, o.estado,
                d.id AS detalleId, d.platillo_id, d.cantidad, d.subtotal,
                p.nombre AS nombrePlatillo
            FROM ordenes o
            JOIN detalles_orden d ON o.id = d.orden_id
            JOIN platillos p ON d.platillo_id = p.id
            WHERE o.estado = 'listo'
            ORDER BY o.id, d.id;
        `;

        const [result] = await pool.query(query);

        // Reestructurar los datos para agrupar los detalles de cada orden
        const ordenes = result.reduce((acc, row) => {
            let orden = acc.find(o => o.ordenId === row.ordenId);
            if (!orden) {
                orden = {
                    ordenId: row.ordenId,
                    usuarioId: row.id_usuario,
                    mesaId: row.mesa_id,
                    fechaOrden: row.fecha_orden,
                    total: row.total,
                    estado: row.estado,
                    items: []
                };
                acc.push(orden);
            }

            orden.items.push({
                detalleId: row.detalleId,
                platilloId: row.platillo_id,
                nombre: row.nombrePlatillo,
                cantidad: row.cantidad,
                subtotal: row.subtotal
            });

            return acc;
        }, []);

        res.status(200).json({
            success: true,
            ordenes
        });
    } catch (error) {
        console.error("Error al obtener órdenes en estado 'Listo':", error);
        res.status(500).json({
            success: false,
            message: "Error al obtener órdenes",
            error: error.message
        });
    }
});

router.post("/entregar-orden/:id", async (req, res) => {
    const ordenId = req.params.id;

    // Verificar el estado actual de la orden
    const estadoQuery = 'SELECT estado FROM ordenes WHERE id = ?';
    try {
        const [orden] = await pool.query(estadoQuery, [ordenId]);
        
        if (orden.length === 0) {
            return res.status(404).send('Orden no encontrada');
        }

        const estadoActual = orden[0].estado;
        if (estadoActual !== 'listo') {
            return res.status(400).send('La orden debe estar en estado "listo" para ser entregada');
        }

        // Actualizar el estado a "entregado"
        const query = 'UPDATE ordenes SET estado = "entregado" WHERE id = ?';
        const [result] = await pool.query(query, [ordenId]);

        res.status(200).json({
            success: true,
            message: 'Orden entregada exitosamente',
            ordenId: ordenId,
            estado: 'entregado'
        });
    } catch (err) {
        console.error(`Error al entregar orden: ${err}`);
        res.status(500).send("Error al entregar la orden");
    }
});

// Obtener órdenes en estado "Entregado" con detalles de cada platillo
router.get("/ordenes-entregados", async (req, res) => {
    try {
        const query = `
            SELECT o.id AS ordenId, o.id_usuario, o.mesa_id, o.fecha_orden, o.total, o.estado,
                d.id AS detalleId, d.platillo_id, d.cantidad, d.subtotal,
                p.nombre AS nombrePlatillo,
                u.nombre AS nombreMesero
            FROM ordenes o
            JOIN detalles_orden d ON o.id = d.orden_id
            JOIN platillos p ON d.platillo_id = p.id
            JOIN usuarios u ON o.id_usuario = u.id
            WHERE o.estado = 'entregado'
            ORDER BY o.id, d.id;
        `;

        const [result] = await pool.query(query);

        // Reestructurar los datos para agrupar los detalles de cada orden
        const ordenes = result.reduce((acc, row) => {
            let orden = acc.find(o => o.ordenId === row.ordenId);
            if (!orden) {
                orden = {
                    ordenId: row.ordenId,
                    usuarioId: row.id_usuario,
                    mesaId: row.mesa_id,
                    fechaOrden: row.fecha_orden,
                    total: row.total,
                    estado: row.estado,
                    nombreMesero: row.nombreMesero, 
                    items: []
                };
                acc.push(orden);
            }

            orden.items.push({
                detalleId: row.detalleId,
                platilloId: row.platillo_id,
                nombre: row.nombrePlatillo,
                cantidad: row.cantidad,
                subtotal: row.subtotal
            });

            return acc;
        }, []);

        res.status(200).json({
            success: true,
            ordenes
        });
    } catch (error) {
        console.error("Error al obtener órdenes en estado 'Entregado':", error);
        res.status(500).json({
            success: false,
            message: "Error al obtener órdenes",
            error: error.message
        });
    }
});


module.exports = router;