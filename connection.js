import mssql from 'mssql'

const connectionSettings = {
  server: 'localhost',
  databade: 'DBAUTH',
  user: 'user',
  password: 'root',
  options: {
    encryt: true,
    trustServerCertificate: true
  }
}

export const getConnection = async () => {
  try {
    const pool = await mssql.connect(connectionSettings)
    console.log('Connected to SQL Server')
    return pool
  } catch (e) {
    console.error('Database connection failed: ', e)
  }
}

// export const getConnection = () => {
//   return mssql.connect(connectionSettings)
//     .then((pool) => {
//       console.log('Connected to SQL Server')
//       return pool
//     })
//     .catch((e) => {
//       console.error('Database connection failed: ', e)
//       throw e // Re-throw the error for handling in the caller function
//     })
// }

export { mssql }
