const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const upload = multer({ 
    dest: 'uploads/',
    limits: { fileSize: 10 * 1024 * 1024 }
}).single('image');

app.use('/images', express.static(uploadDir));

app.post('/upload-image', (req, res) => {
    upload(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ error: 'La imagen excede el límite de 5MB.' });
            }
            return res.status(400).json({ error: err.message });
        } else if (err) {
            return res.status(500).json({ error: 'Error interno del servidor.' });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'Por favor, selecciona una imagen.' });
        }

        res.status(200).json({
            message: 'Imagen subida con éxito',
            file: {
                originalName: req.file.originalname,
                filename: req.file.filename,
                url: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
            }
        });
    });
});

app.get('/', (req, res) => res.send('Servidor de archivos activo.'));

app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});