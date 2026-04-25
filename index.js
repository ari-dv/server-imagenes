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

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir)
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        cb(null, 'img-' + Date.now() + ext);
    }
});

const imageFilter = (req, file, cb) => {
    const extensionesPermitidas = /\.(jpg|jpeg|png|webp)$/i;
    if (extensionesPermitidas.test(file.originalname)) {
        cb(null, true); 
    } else {
        cb(new Error('FORMATO_INVALIDO'), false);
    }
};

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, 
    fileFilter: imageFilter 
}).single('image');

app.use('/images', express.static(uploadDir));

const preventCpuSpike = (req, res, next) => {
    const contentLength = parseInt(req.headers['content-length'], 10);
    const limiteBytes = 5 * 1024 * 1024; 

    if (contentLength && contentLength > limiteBytes) {
        return res.status(413).json({ 
            error: 'El archivo es demasiado grande. Máximo 5MB permitidos.' 
        });
    }
    next();
};


app.post('/upload-image', preventCpuSpike, (req, res) => {
    upload(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(413).json({ error: 'La imagen excede el límite de 5MB.' });
            }
            return res.status(400).json({ error: err.message });
        } 
        else if (err) {
            if (err.message === 'FORMATO_INVALIDO') {
                return res.status(415).json({ error: 'Solo se permiten subir imágenes (JPG, PNG, WEBP, etc).' });
            }
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
    console.log(`✅ Servidor corriendo en puerto ${PORT}`);
});