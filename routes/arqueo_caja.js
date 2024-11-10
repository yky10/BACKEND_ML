const express = require('express')
const pool = require('../config/db');
const router = express.Router();

// Obtener arqueo de caja por fecha con detalles de órdenes
router.get("/arqueo-caja/:fecha", async (req, res) => {
    const fecha = req.params.fecha;

    try {
        const query = `
            SELECT o.id AS ordenId, o.total, d.platillo_id, d.cantidad, p.nombre AS nombrePlatillo
            FROM ordenes o
            JOIN detalles_orden d ON o.id = d.orden_id
            JOIN platillos p ON d.platillo_id = p.id
            WHERE DATE(o.fecha_orden) = ?
            AND o.estado = 'entregado';
        `;

        const [result] = await pool.query(query, [fecha]);

        if (result.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No se encontraron órdenes para la fecha especificada."
            });
        }

        // Calcular total de ventas y agrupar detalles por orden
        const totalVentas = result.reduce((acc, row) => acc + row.total, 0);
        const totalOrdenes = result.length;

        // Agrupar detalles por orden
        const ordenes = result.reduce((acc, row) => {
            let orden = acc.find(o => o.ordenId === row.ordenId);
            if (!orden) {
                orden = {
                    ordenId: row.ordenId,
                    total: row.total,
                    items: []
                };
                acc.push(orden);
            }

            orden.items.push({
                platilloId: row.platillo_id,
                nombrePlatillo: row.nombrePlatillo,
                cantidad: row.cantidad
            });

            return acc;
        }, []);

        res.status(200).json({
            success: true,
            totalVentas: totalVentas || 0,
            totalOrdenes: totalOrdenes || 0,
            fecha: fecha,
            ordenes // Detalles de las órdenes entregadas
        });
    } catch (error) {
        console.error("Error al obtener arqueo de caja:", error);
        res.status(500).json({
            success: false,
            message: "Error al obtener el arqueo de caja",
            error: error.message
        });
    }
});

/*
// Obtener arqueo de caja por mes
router.get("/arqueo-caja/:anio/:mes", async (req, res) => {
    const { anio, mes } = req.params;

    try {
        const query = `
            SELECT o.id AS ordenId, o.total, d.platillo_id, d.cantidad, p.nombre AS nombrePlatillo
            FROM ordenes o
            JOIN detalles_orden d ON o.id = d.orden_id
            JOIN platillos p ON d.platillo_id = p.id
            WHERE YEAR(o.fecha_orden) = ? AND MONTH(o.fecha_orden) = ?
            AND o.estado = 'entregado';
        `;

        const [result] = await pool.query(query, [anio, mes]);

        if (result.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No se encontraron órdenes para el mes y año especificados."
            });
        }

        // Calcular total de ventas y agrupar detalles por orden
        const totalVentas = result.reduce((acc, row) => acc + parseFloat(row.total), 0);
        const totalOrdenes = result.length;

        // Agrupar detalles por orden
        const ordenes = result.reduce((acc, row) => {
            let orden = acc.find(o => o.ordenId === row.ordenId);
            if (!orden) {
                orden = {
                    ordenId: row.ordenId,
                    total: row.total,
                    items: []
                };
                acc.push(orden);
            }

            orden.items.push({
                platilloId: row.platillo_id,
                nombrePlatillo: row.nombrePlatillo,
                cantidad: row.cantidad
            });

            return acc;
        }, []);

        res.status(200).json({
            success: true,
            totalVentas: totalVentas || 0,
            totalOrdenes: totalOrdenes || 0,
            anio: anio,
            mes: mes,
            ordenes // Detalles de las órdenes entregadas
        });
    } catch (error) {
        console.error("Error al obtener arqueo de caja:", error);
        res.status(500).json({
            success: false,
            message: "Error al obtener el arqueo de caja",
            error: error.message
        });
    }
});
*/


module.exports = router;