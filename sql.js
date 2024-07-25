import bcrypt from 'bcrypt'
import { getConnection, mssql } from './connection.js'
import { SALT_ROUNDS } from './config.js'
import Validaton from './validations.js'

export const getAllUsers = async () => {
  const pool = await getConnection()
  try {
    const results = await pool.request().query('SELECT * FROM dbo.UserLogin')
    console.table(results.recordset)
    return results.recordset
  } catch (error) {
    console.error('Query failed: ', error)
  } finally {
    await pool.close()
    console.log('Conection closed')
  }
}

export const getOneUser = async (username) => {
  const pool = await getConnection()

  try {
    const results = await pool.request()
      .input('username', mssql.VarChar(20), username)
      .query('SELECT * FROM dbo.UserLogin where username = @username')

    // console.log(results.recordset)
    // console.log(`product listed for ${username}`)

    return results.recordset[0]
  } catch (error) {
    console.error('Query failed: ', error)
  } finally {
    await pool.close()
    console.log('Conection closed')
  }
}

export const addNewUser = async ({ username, password }) => {
  // Validations
  Validaton.username(username)
  Validaton.password(password)

  const user = await getOneUser(username)
  if (user) throw new Error('username already exist')

  // Encrypt password
  const securePass = await bcrypt.hash(password, SALT_ROUNDS)

  const userObj = {
    username,
    password: securePass,
    created_date: new Date()
  }

  try {
    // open conection to DB
    const pool = await getConnection()

    // execute the query in the DB to insert the new user
    await pool.request()
      .input('username', mssql.VarChar(20), userObj.username)
      .input('password', mssql.VarChar(255), userObj.password)
      .input('created_date', mssql.DateTime, userObj.created_date)
      .query('INSERT INTO dbo.UserLogin ( username, password, created_date) VALUES ( @username, @password, @created_date)')
    console.log('User added successfully:')
  } catch (err) {
    console.error('Error adding new user', err.message)
    throw new Error(err.message)
  } finally {
    await mssql.close()
    console.log('Conection closed')
  }

  // get created user from DB
  const addedUser = await getOneUser(username)

  return {
    userId: addedUser.iduser,
    username: addedUser.username,
    created_date: addedUser.created_date
  }
}

export const loginUser = async ({ username, password }) => {
  // Validations
  Validaton.username(username)
  Validaton.password(password)

  const user = await getOneUser(username)
  const isValid = await bcrypt.compare(password, user.password)
  if (!isValid) throw new Error('the password and username doesnt match')

  return {
    userId: user.iduser,
    username: user.username,
    created_date: user.created_date
  }
}

// addNewUser()
// getAllUsers()
// getOneUser()
