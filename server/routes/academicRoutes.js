const express = require('express');
const router = express.Router();
const academicController = require('../controllers/academicController');
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
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// ─────────────────────────────────────────────────────────────────────────────
// THESIS ROUTES
// ─────────────────────────────────────────────────────────────────────────────
router.get('/thesis/:studentId?', authenticate, academicController.getThesisByStudent);
router.post('/thesis/draft', authenticate, academicController.saveThesisDraft);
router.post('/thesis/submit', authenticate, upload.single('file'), academicController.submitThesis);
router.patch('/thesis/status', authenticate, authorize(['admin', 'guide', 'hod']), academicController.updateThesisStatus);
router.post('/thesis/comment', authenticate, academicController.addThesisComment);

// ─────────────────────────────────────────────────────────────────────────────
// DAILY PROGRESS LOGS
// ─────────────────────────────────────────────────────────────────────────────
router.post('/dailylog', authenticate, upload.single('file'), academicController.createDailyLog);
router.get('/dailylog/my', authenticate, academicController.getMyDailyLogs);
router.get('/dailylog/student/:studentId', authenticate, academicController.getStudentDailyLogs);
router.patch('/dailylog/review', authenticate, authorize(['admin', 'guide', 'hod']), academicController.reviewDailyLog);

// ─────────────────────────────────────────────────────────────────────────────
// ACADEMIC TASKS
// ─────────────────────────────────────────────────────────────────────────────
router.get('/tasks/:taskId', authenticate, academicController.getAcademicTaskDetail);
router.post('/tasks', authenticate, academicController.updateAcademicTaskDetail);

// ─────────────────────────────────────────────────────────────────────────────
// MARKS
// ─────────────────────────────────────────────────────────────────────────────
router.post('/marks', authenticate, authorize(['admin', 'guide', 'hod']), academicController.submitMarks);
router.get('/marks/:studentId?', authenticate, academicController.getStudentMarks);

// ─────────────────────────────────────────────────────────────────────────────
// CERTIFICATES
// ─────────────────────────────────────────────────────────────────────────────
router.post('/certificate', authenticate, authorize(['admin', 'hod']), academicController.generateCertificate);
router.get('/certificate/:studentId?', authenticate, academicController.getCertificates);
// Public certificate verification route (does not require login/auth)
router.get('/certificate/verify/:uuid', academicController.verifyCertificate);

// ─────────────────────────────────────────────────────────────────────────────
// RESEARCH REPOSITORY
// ─────────────────────────────────────────────────────────────────────────────
router.post('/research/upload', authenticate, upload.single('file'), academicController.uploadResearchPaper);
router.get('/research/approved', authenticate, academicController.getApprovedResearchPapers);
router.get('/research/my', authenticate, academicController.getMyUploadedPapers);
router.get('/research/pending', authenticate, authorize(['admin', 'guide', 'hod']), academicController.getPendingResearchPapers);
router.patch('/research/review', authenticate, authorize(['admin', 'guide', 'hod']), academicController.reviewResearchPaper);
router.post('/research/bookmark', authenticate, academicController.toggleBookmark);
router.get('/research/bookmarks', authenticate, academicController.getBookmarkedPapers);

// ─────────────────────────────────────────────────────────────────────────────
// OVERVIEW STATS
// ─────────────────────────────────────────────────────────────────────────────
router.get('/overview/guide', authenticate, authorize(['admin', 'guide']), academicController.getGuideOverview);
router.get('/overview/hod', authenticate, authorize(['admin', 'hod']), academicController.getHodOverview);

module.exports = router;
