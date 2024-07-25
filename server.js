import express from 'express'
import jwt from 'jsonwebtoken'
import cookieParser from 'cookie-parser'
import { PORT, SECRET_KEY } from './config.js'
import { addNewUser, loginUser } from './sql.js'

const app = express()

// middlewares
app.use(express.json())
app.use(cookieParser())
app.use((req, res, next) => {
  const token = req.cookies.access_token

  req.session = { user: null }

  try {
    const data = jwt.verify(token, SECRET_KEY)
    req.session.user = data
  } catch (e) {}
  next()
})

// serve static files
app.set('view engine', 'ejs')
app.use(express.static('public'))

// rutes
app.get('/', (req, res) => {
  const { user } = req.session

  if (user) {
    res.render('home', user)
  } else {
    res.render('home')
  }
})

app.post('/login', async (req, res) => {
  const { username, password } = req.body

  try {
    const user = await loginUser({ username, password })

    const token = jwt.sign({ id: user.userId, username: user.username }, SECRET_KEY, {
      expiresIn: '1h'
    })

    res
      .cookie('access_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 1000 * 60 * 60
      })
      .status(200).json({
        user,
        token,
        redirect: '/protected'
      })
  } catch (e) {
    res.status(400).send({ details: e.message })
  }
})

app.post('/register', async (req, res) => {
  const { username, password } = req.body

  try {
    const user = await addNewUser({ username, password })
    res.status(201).json({
      newUser: user,
      redirect: '/'
    })
  } catch (e) {
    res.status(400).send({ details: e.message })
  }
})

app.post('/logout', (req, res) => {
  res
    .clearCookie('access_token')
    .redirect('/')
})

app.get('/protected', (req, res) => {
  const { user } = req.session

  if (!user) res.status(406).send('access unautorized')

  res.render('protected', user)
})

// running server
app.listen(PORT, () => {
  console.log(`server served in port: ${PORT}`)
})
