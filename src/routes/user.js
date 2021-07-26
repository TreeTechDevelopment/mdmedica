const express = require('express');
const multer = require('multer');

const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

const router = express.Router(); 

const { login, validUserToken, getInfoUser, editUser, saveSchedule, getSchedule, deleteUser, createUser, createPassword,updateServicePrice,
    updateImages, updateText, getReviews, updateReview, getUsers, getUser, getClient, getClientResults, updateLabDescription } = require('../controllers/user')
const { cookiesAuthMiddleware } = require('../helpers/auth')

router.get('/admin/user', cookiesAuthMiddleware, getInfoUser)
router.get('/admin/users', cookiesAuthMiddleware, getUsers)
router.get('/admin/users/:id', cookiesAuthMiddleware, getUser)
router.get('/admin/valid', cookiesAuthMiddleware, validUserToken)
router.get('/admin/schedule', cookiesAuthMiddleware, getSchedule)
router.get('/admin/reviews', cookiesAuthMiddleware, getReviews)
router.get('/admin/client', cookiesAuthMiddleware, getClient)
router.get('/admin/client/results', cookiesAuthMiddleware, getClientResults)

router.post('/admin/login', login)
router.post('/admin/schedule', cookiesAuthMiddleware, saveSchedule)
router.post('/admin/labs/description', cookiesAuthMiddleware, updateLabDescription)
router.post('/admin/service/price', cookiesAuthMiddleware, updateServicePrice)
router.post('/admin/user', cookiesAuthMiddleware, createUser)

router.put('/admin/user', cookiesAuthMiddleware, upload.single('image'), editUser)
router.put('/admin/imgs', cookiesAuthMiddleware, upload.array('images'), updateImages)
router.put('/admin/text', cookiesAuthMiddleware, updateText)
router.put('/admin/reviews', cookiesAuthMiddleware, updateReview)
router.put('/admin/password', createPassword)

router.delete('/admin/users/:id', cookiesAuthMiddleware, deleteUser)

module.exports = router;