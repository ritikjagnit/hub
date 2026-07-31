const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { authenticate, authorize } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
});

const upload = multer({ storage: storage });

router.get('/', authenticate, projectController.getAllProjects);
router.get('/:id', authenticate, projectController.getProjectById);
router.post('/', authenticate, authorize(['admin', 'project_manager']), projectController.createProject);
router.put('/:id', authenticate, authorize(['admin', 'project_manager']), projectController.updateProject);
router.delete('/:id', authenticate, authorize(['admin', 'project_manager']), projectController.deleteProject);
router.post('/:id/assign', authenticate, authorize(['admin', 'project_manager']), projectController.assignTeam);
router.post('/:id/upload', authenticate, upload.single('file'), projectController.uploadDocument);

module.exports = router;
