const express = require('express')
const pool = require('../config/db'); //importamos la bd
const router = express.Router();

router.get("/listar", async (req, res) => {
    try {
        const [result] = await pool.query(`
            SELECT 
                f.id AS factura_id,
                f.fecha_factura,
                c.id AS cliente_id,
                c.nombre AS nombre_cliente,
                o.id AS orden_id,
                o.fecha_orden,
                o.total AS total_orden,
                m.numero AS numero_mesa,
                p.id AS platillo_id,
                p.nombre AS nombre_platillo,
                p.descripcion AS descripcion_platillo,
                p.precio AS precio_platillo,
                do.cantidad,
                (p.precio * do.cantidad) AS subtotal,
                cat.nombre AS categoria_platillo
            FROM facturas f
            INNER JOIN clientes c ON f.cliente_id = c.id
            INNER JOIN ordenes o ON f.orden_id = o.id
            INNER JOIN mesas m ON o.mesa_id = m.id
            INNER JOIN detalles_orden do ON o.id = do.orden_id
            INNER JOIN platillos p ON do.platillo_id = p.id
            INNER JOIN categorias_platillos cat ON p.categoria_id = cat.id
            ORDER BY f.fecha_factura DESC, f.id, p.nombre
        `);

        const facturasAgrupadas = result.reduce((acc, row) => {
            const facturaId = row.factura_id;

            if (!acc[facturaId]) {
                acc[facturaId] = {
                    factura_id: facturaId,
                    fecha_factura: row.fecha_factura,
                    cliente: {
                        id: row.cliente_id,
                        nombre: row.nombre_cliente,
                    },
                    orden: {
                        id: row.orden_id,
                        fecha: row.fecha_orden,
                        total: row.total_orden,
                        mesa: row.numero_mesa
                    },
                    platillos: []
                };
            }

            acc[facturaId].platillos.push({
                id: row.platillo_id,
                nombre: row.nombre_platillo,
                descripcion: row.descripcion_platillo,
                precio_unitario: row.precio_platillo,
                cantidad: row.cantidad,
                subtotal: row.subtotal,
                categoria: row.categoria_platillo
            });

            return acc;
        }, {});

        const facturas = Object.values(facturasAgrupadas);

        res.status(200).json(facturas);
    } catch (error) {
        console.error(`Error al mostrar Facturas con detalles: ${error}`);
        res.status(500).send("Error del servidor");
    }
});

router.post("/guardar", async (req, res) => {
    try {
        console.log(req.body);
        const cliente_id = req.body.cliente_id;
        const orden_id = req.body.orden_id;
        
        const result = await pool.query(
            'INSERT INTO facturas(cliente_id, orden_id, fecha_factura ) VALUES (?, ?, NOW())',
            [cliente_id, orden_id]
        );
        
        res.status(201).send(`Factura generada exitosamente con ID: ${result.insertId}`);
    } 
    catch (error) {
        console.log(`Error al generar la factura: ${error}`);
        res.status(500).send("Error del servidor");
    }
});

module.exports = router;