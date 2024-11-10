const express = require('express')
const pool = require('../config/db'); // Importamos la base de datos
const router = express.Router();

// Reporte de ventas diarias
router.get("/ventas-diarias", async (req, res) => {
    try {
        const query = `
            SELECT 
                DATE(o.fecha_orden) AS fecha,
                COUNT(o.id) AS total_ordenes,
                SUM(o.total) AS total_ventas,
                u.username,
                CONCAT(p.primer_nombre, ' ', p.primer_apellido) AS nombre_usuario
            FROM ordenes o
            JOIN usuarios u ON o.id_usuario = u.id_usuario
            JOIN persona p ON u.id_persona = p.id
            WHERE o.estado = 'entregado'
            GROUP BY DATE(o.fecha_orden), u.username, nombre_usuario
            ORDER BY DATE(o.fecha_orden) DESC;
        `;

        const [ventasDiarias] = await pool.query(query);

        if (!ventasDiarias || ventasDiarias.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No se encontraron ventas diarias."
            });
        }

        res.status(200).json({
            success: true,
            reporte: ventasDiarias
        });
    } catch (error) {
        handleError(res, error, "Error al obtener reporte de ventas diarias");
    }
});

// Reporte de ventas por platillo
router.get('/ventas-por-platillo', async (req, res) => {
    try {
        const query = `
            SELECT p.nombre AS nombre_platillo, 
                   SUM(do.cantidad) AS cantidad_vendida, 
                   SUM(do.cantidad * p.precio) AS total_ventas
            FROM detalles_orden do
            JOIN platillos p ON do.platillo_id = p.id
            JOIN ordenes o ON do.orden_id = o.id
            WHERE o.estado = 'entregado' 
            GROUP BY p.nombre
            ORDER BY total_ventas DESC;
        `;

        const [ventasPorPlatillo] = await pool.query(query);

        if (!ventasPorPlatillo || ventasPorPlatillo.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No se encontraron ventas por platillo."
            });
        }

        res.status(200).json({
            success: true,
            reporte: ventasPorPlatillo
        });
    } catch (error) {
        handleError(res, error, "Error al obtener ventas por platillos");
    }
});

// Ventas por mesa
router.get('/ventas-por-mesa', async (req, res) => {
    try {
        const query = `
            SELECT o.mesa_id AS numero_mesa, 
                   SUM(do.cantidad * p.precio) AS total_ventas
            FROM ordenes o
            JOIN detalles_orden do ON o.id = do.orden_id
            JOIN platillos p ON do.platillo_id = p.id
            WHERE o.estado = 'entregado'
            GROUP BY o.mesa_id
            ORDER BY total_ventas DESC;
        `;

        const [ventasmesa] = await pool.query(query);

        res.status(200).json({
            success: true,
            reporte: ventasmesa
        });
    } catch (error) {
        console.error("Error al obtener ventas por mesa:", error);
        res.status(500).json({
            success: false,
            message: "Error al obtener reporte",
            error: error.message
        });
    }
});

//  reporte de ventas por mes
router.get('/ventas-por-mes', async (req, res) => {
    try {
        const query = `
            SELECT 
                YEAR(o.fecha_orden) AS anio,
                MONTH(o.fecha_orden) AS mes,
                SUM(o.total) AS total_ventas
            FROM ordenes o
            WHERE o.estado = 'entregado'
            GROUP BY YEAR(o.fecha_orden), MONTH(o.fecha_orden)
            ORDER BY anio DESC, mes DESC;
        `;

        const [resultMes] = await pool.query(query);

        res.status(200).json({
            success: true,
            reporte: resultMes
        });
    } catch (error) {
        console.error("Error al obtener reporte de ventas por mes:", error);
        res.status(500).json({
            success: false,
            message: "Error al obtener reporte",
            error: error.message
        });
    }
});

router.get('/estadisticas', async (req, res) => {
    try {
      // Consulta para obtener el total de órdenes hoy con los estados mencionados
      const queryOrdenesHoy = `
        SELECT COUNT(*) AS totalOrdenesHoy
        FROM ordenes
        WHERE DATE(fecha_orden) = CURDATE() 
          AND estado IN ('pendiente', 'preparando', 'entregado')
      `;
  
      // Consulta para obtener el total de clientes activos (que tienen NIT)
      const queryClientesActivos = `
        SELECT COUNT(*) AS totalClientesActivos
        FROM clientes
        WHERE nit_cliente IS NOT NULL
      `;
  
      // Consulta para obtener las últimas 5 órdenes procesadas, incluyendo las mesas
      const queryUltimasOrdenes = `
        SELECT o.id, o.fecha_orden, o.total, u.username AS mesero, o.estado, o.mesa_id
        FROM ordenes o
        JOIN usuarios u ON o.id_usuario = u.id_usuario
        WHERE o.estado = 'entregado' -- Puedes agregar más estados si deseas
        ORDER BY o.fecha_orden DESC
        LIMIT 5;
      `;
  
      // Ejecutar las consultas
      const [resultOrdenesHoy] = await pool.execute(queryOrdenesHoy);
      const [resultClientesActivos] = await pool.execute(queryClientesActivos);
      const [resultUltimasOrdenes] = await pool.execute(queryUltimasOrdenes);
  
      // Enviar los resultados como respuesta, incluyendo las mesas en las últimas órdenes
      res.json({
        totalOrdenesHoy: resultOrdenesHoy[0].totalOrdenesHoy,
        totalClientesActivos: resultClientesActivos[0].totalClientesActivos,
        ultimasOrdenes: resultUltimasOrdenes // Ahora incluye mesa_id
      });
  
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({ error: 'Error al obtener estadísticas', message: error.message });
    }
});


module.exports = router;