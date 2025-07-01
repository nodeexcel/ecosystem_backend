const express=require('express');
const contactController=require('../controllers/contactController');
const authMiddleware=require('../middleware/authMiddleware');
const {upload}=require('../middleware/uploadMiddleware');
const router = express.Router();


router.post('/upload-contacts',upload,authMiddleware,contactController.uploadContact);

router.post('/create-list',authMiddleware,contactController.createList);

router.post('/add-contact',authMiddleware,contactController.addContact);

router.patch('/delete-contact',authMiddleware,contactController.deleteContact);

router.post('/update-contact',authMiddleware,contactController.updateContact);

router.post("/add-contacts-to-list",authMiddleware,contactController.addContactToList);

router.get("/get-contact/:listId",contactController.viewContactList);

router.patch("/remove-contact-from-list",contactController.removeContactFromList);

router.post("/update-list",authMiddleware,contactController.updateList);

router.get("/get-contact-list",authMiddleware,contactController.getContactList);

router.get("/get-lists",authMiddleware,contactController.getLists);

router.post("/duplicate-list",authMiddleware,contactController.duplicateList);

router.delete("/delete-list/:id",authMiddleware,contactController.deleteList);

module.exports = router;