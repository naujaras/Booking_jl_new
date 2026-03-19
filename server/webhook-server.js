import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

// Almacén en memoria para el estado de los contratos
const contractStatus = new Map();

app.use(cors());
app.use(express.json());

// Webhook para recibir notificación de contrato firmado
// POST /api/contract-signed
app.post('/api/contract-signed', (req, res) => {
  console.log('Webhook recibido:', JSON.stringify(req.body, null, 2));

  try {
    // El body puede ser un array o un objeto
    const data = Array.isArray(req.body) ? req.body[0] : req.body;

    if (data && data.Status === 'completed' && data.URL) {
      // Guardar con timestamp como ID temporal (o puedes pasar un contractId)
      const contractId = req.query.contractId || 'latest';

      contractStatus.set(contractId, {
        status: 'completed',
        pdfUrl: data.URL,
        signedAt: new Date().toISOString()
      });

      console.log(`Contrato ${contractId} marcado como firmado`);
      console.log(`PDF URL: ${data.URL}`);

      res.json({ success: true, message: 'Contrato actualizado correctamente' });
    } else {
      res.status(400).json({ success: false, message: 'Datos inválidos. Se esperaba Status: completed y URL' });
    }
  } catch (error) {
    console.error('Error procesando webhook:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Endpoint para consultar el estado del contrato (polling desde frontend)
// GET /api/contract-status/:contractId
app.get('/api/contract-status/:contractId', (req, res) => {
  const { contractId } = req.params;
  const status = contractStatus.get(contractId) || contractStatus.get('latest');

  if (status) {
    res.json({
      signed: true,
      pdfUrl: status.pdfUrl,
      signedAt: status.signedAt
    });
  } else {
    res.json({
      signed: false,
      pdfUrl: null,
      signedAt: null
    });
  }
});

// Endpoint para limpiar el estado (útil para testing)
app.delete('/api/contract-status/:contractId', (req, res) => {
  const { contractId } = req.params;
  contractStatus.delete(contractId);
  contractStatus.delete('latest');
  res.json({ success: true, message: 'Estado limpiado' });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', contracts: contractStatus.size });
});

app.listen(PORT, () => {
  console.log(`
========================================
  Webhook Server corriendo en puerto ${PORT}
========================================

Para notificar que un contrato ha sido firmado:

  POST http://localhost:${PORT}/api/contract-signed

  Body (JSON):
  [
    {
      "Status": "completed",
      "URL": "https://docuseal.com/file/tu-archivo.pdf"
    }
  ]

  O con contractId específico:
  POST http://localhost:${PORT}/api/contract-signed?contractId=NJ-123456

Para consultar estado:
  GET http://localhost:${PORT}/api/contract-status/latest
  GET http://localhost:${PORT}/api/contract-status/NJ-123456

========================================
`);
});
