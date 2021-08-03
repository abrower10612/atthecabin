const checklistController = require('../controllers/checklist');
const express = require('express');
const checklist = require('../models/checklist');
const router = express.Router();



router.get('/new-checklist/:propertyId', checklistController.getLists);
router.get('/user-checklists/:propertyId', checklistController.getUserChecklist);
router.get('/user-list-update', checklistController.getUserChecklistUpdate);
router.get('/checklist', checklistController.getChecklist);
router.get('/checklist-user', checklistController.getUserProperties);
router.get('/delete', checklistController.deleteChecklistItem);

router.get('/deleteList', checklistController.deleteChecklist);
router.post('/delete', checklistController.deleteChecklistItem);
router.post('/checklist', checklistController.addChecklist);
router.post('/addTask', checklistController.addTask);
router.post('/update', checklistController.updateChecklist);
router.post('/userUpdate', checklistController.saveUserList);

//router.post('/checklist', checklistController.postChecklist);




// router.get('/inventory', inventoryController.getAdminProperties);
// router.get('/inventory/:propertyId', inventoryController.getInventory);
// router.get('/update', inventoryController.getUserProperties);
// router.get('/user-update/:propertyId', inventoryController.getUserInventory);

// router.post('/inventory', inventoryController.addInventory);
// router.post('/update', inventoryController.updateInventory);
// router.get('/delete', inventoryController.deleteInventory);
// router.post('/delete', inventoryController.deleteInventory);
// router.post('/update-user', inventoryController.updateUserInventory);

module.exports = router;
