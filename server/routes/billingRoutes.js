const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billingController');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/invoices', authenticate, authorize(['admin', 'project_manager', 'manager']), billingController.createInvoice);
router.get('/invoices', authenticate, billingController.getInvoices);
router.put('/invoices/:id', authenticate, authorize(['admin', 'project_manager', 'manager']), billingController.updateInvoice);
router.delete('/invoices/:id', authenticate, authorize(['admin']), billingController.deleteInvoice);

router.post('/expenses', authenticate, billingController.createExpense);
router.get('/expenses', authenticate, billingController.getExpenses);

router.get('/cost-summary/:id', authenticate, billingController.getProjectCostSummary);

module.exports = router;
