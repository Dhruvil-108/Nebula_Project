const express = require('express');
const router = express.Router();

const leadController = require('../controllers/leadController');
const contactController = require('../controllers/contactController');
const companyController = require('../controllers/companyController');
const dealController = require('../controllers/dealController');
const activityController = require('../controllers/activityController');
const { getCrmSummary } = require('../controllers/crmSummaryController');
const { requireAuth } = require('../middleware/auth');
const { requireModuleAccess } = require('../middleware/moduleAccess');

// Every CRM route requires an authenticated session
router.use(requireAuth);

// ── Dashboard/summary (view) ──
router.get('/summary', requireModuleAccess('crm', 'view'), getCrmSummary);

// ── Leads ──
router.get('/leads', requireModuleAccess('crm', 'view'), leadController.getLeads);
router.post('/leads', requireModuleAccess('crm', 'create'), leadController.createLead);
router.get('/leads/:id', requireModuleAccess('crm', 'view'), leadController.getLeadById);
router.patch('/leads/:id', requireModuleAccess('crm', 'edit'), leadController.updateLead);
router.delete('/leads/:id', requireModuleAccess('crm', 'delete'), leadController.deleteLead);
router.post('/leads/:id/convert', requireModuleAccess('crm', 'edit'), leadController.convertLead);

// ── Contacts ──
router.get('/contacts', requireModuleAccess('crm', 'view'), contactController.getContacts);
router.post('/contacts', requireModuleAccess('crm', 'create'), contactController.createContact);
router.get('/contacts/:id', requireModuleAccess('crm', 'view'), contactController.getContactById);
router.patch('/contacts/:id', requireModuleAccess('crm', 'edit'), contactController.updateContact);
router.delete('/contacts/:id', requireModuleAccess('crm', 'delete'), contactController.deleteContact);

// ── Companies ──
router.get('/companies', requireModuleAccess('crm', 'view'), companyController.getCompanies);
router.post('/companies', requireModuleAccess('crm', 'create'), companyController.createCompany);
router.get('/companies/:id', requireModuleAccess('crm', 'view'), companyController.getCompanyById);
router.patch('/companies/:id', requireModuleAccess('crm', 'edit'), companyController.updateCompany);
router.delete('/companies/:id', requireModuleAccess('crm', 'delete'), companyController.deleteCompany);

// ── Deals ('/pipeline' must precede '/:id') ──
router.get('/deals/pipeline', requireModuleAccess('crm', 'view'), dealController.getDealPipeline);
router.get('/deals', requireModuleAccess('crm', 'view'), dealController.getDeals);
router.post('/deals', requireModuleAccess('crm', 'create'), dealController.createDeal);
router.get('/deals/:id', requireModuleAccess('crm', 'view'), dealController.getDealById);
router.patch('/deals/:id', requireModuleAccess('crm', 'edit'), dealController.updateDeal);
router.delete('/deals/:id', requireModuleAccess('crm', 'delete'), dealController.deleteDeal);

// ── Activities ──
router.get('/activities', requireModuleAccess('crm', 'view'), activityController.getActivities);
router.post('/activities', requireModuleAccess('crm', 'create'), activityController.createActivity);
router.patch('/activities/:id', requireModuleAccess('crm', 'edit'), activityController.updateActivity);

module.exports = router;
