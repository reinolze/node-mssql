const express = require('express')
const dotenv = require('dotenv')
const mssql = require('mssql')


const app = express();
const router = express.Router();

dotenv.config();

const config = {
    driver: process.env.SQL_DRIVER,
    server: process.env.SQL_SERVER,
    port: parseInt(process.env.SQL_PORT),
    database: process.env.SQL_DATABASE,
    user: process.env.SQL_UID,
    password: process.env.SQL_PWD,
    options: {
        encrypt: false,
        enableArithAbort: false
    },
};
const pool = new mssql.ConnectionPool(config);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get('/', (req, res) => {
    res.send('?? Teaming up with NodeJS and SQL Server');
});

app.get('/postwork', async (req, res) => {
    // ./postwork로 접속하면 관련 공사명 리스트업
    // 공사명 입력 역순으로 정렬 필요(프로시저로  변경해야...)
    try {
        await pool.connect();
        
        const result = await pool.request()
            .query(`SELECT DISTINCT ConName FROM tbl_PostWork`);
        const posts = result.recordset;

        if (posts) {
            return res.json(posts);
        } else {
            return res.status(404).json({
                message: 'Record not found'
            });
        }      
     
    } catch (error) {
        return res.status(500).json(error);
    }        
});

app.get('/postwork/:conname', async (req, res) => {
    // 현재 의미가 없긴한데.....
    const { conname } = req.params

    try {
        await pool.connect();
        
        const result = await pool.request()
            .input('ConName', req.params.conname)
            .query(`SELECT count(*) FROM tbl_PostWork where ConName=@ConName`);
        const posts = result.recordset.length ? result.recordset[0] : null;

        
        if (posts) {
            return res.json(posts);
        } else {
            return res.status(404).json({
                message: 'Record not found'
            });
        }      
             
    } catch (error) {
        console.log(error)
        return res.status(500).json(error);        
    }    
});

app.get('/postwork/:conname/:status', async (req, res) => {
    // ./postwork/:conname/:status로 접속하면 해당 공사, status 별로 리스트 업
    // status = ALL, 전부표시
    const { conname } = req.params
    const { status } = req.params

    try {
        await pool.connect();
        
        const result = await pool.request()
            .input('ConName', mssql.VarChar, conname)
            .input('status', mssql.VarChar, status)
            .execute(`dbo.Get_PostWorkListByStatus`);
        const posts = result.recordset;

        if (posts) {
            return res.json(posts);
        } else {
            return res.status(404).json({
                message: 'Record not found'
            });
        }           
        
    } catch (error) {
        console.log(error)
        return res.status(500).json(error);        
    }    
});

app.listen(process.env.PORT, () => {
    console.log(`Server started running on ${process.env.PORT} for ${process.env.NODE_ENV}`);
});