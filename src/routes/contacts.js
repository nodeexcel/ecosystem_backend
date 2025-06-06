const express=require('express');
const contactController=require('../controllers/contactController');
const authMiddleware=require('../middleware/authMiddleware');
const {upload}=require('../middleware/uploadMiddleware');
const router = express.Router();


router.post('/upload-contacts',upload,authMiddleware,contactController.uploadContact);

router.post('/create-list',authMiddleware,contactController.createList);

router.post("/add-contacts-to-list",authMiddleware,contactController.addContactToList);

router.get("/get-contact-list",authMiddleware,contactController.getContactList);

router.get("/get-lists",authMiddleware,contactController.getLists);

module.exports = router;