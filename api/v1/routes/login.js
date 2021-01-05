const fetch = require('node-fetch');

const fetchDiscordProfile = require('../utils/users/fetchDiscordProfile.js');
const putProfile = require('../utils/users/putProfile');
const purgeUsers = require('../utils/users/purgeUsers.js');
const checkAuthentication = require('../utils/users/checkAuthentication.js');


const discordAPI = require('../utils/consts/discordAPI.js');

const { API_ENDPOINT } = discordAPI

module.exports = function(db, router) {
  router.post('/login', (req,res) => {

    const TEMP_PASS = process.env.TEMP_PASS;

    if(req.body.token === TEMP_PASS) {
      res.status(202);
      res.send({ 
        token: TEMP_PASS, 
        msg: 'Logged in',
        success: true
      });
    } else {
      res.status(200);
      res.send({ 
        token: '', 
        msg: 'Invalid password',
        success: false
      });
    }
  });

  router.get('/login/users', async (req, res) => {
    const userList = await db.find({});
    res.send(userList);
  });

  router.delete('/login/users', async (req, res) => {
    const dbResponse = await purgeUsers(db);
    res.send(dbResponse);
  });

  router.get('/OAuth', async (req, res) => {
    console.log(req.query);
    const { code } = req.query;
    const { OAUTH_ID, OAUTH_SECRET, REDIRECT_URL } = process.env;

    const payload = new URLSearchParams();
    payload.append('client_id', OAUTH_ID);
    payload.append('client_secret', OAUTH_SECRET);
    payload.append('grant_type', 'authorization_code');
    payload.append('code', code);
    payload.append('redirect_uri', REDIRECT_URL);
    payload.append('scope', 'identify');

    const data = await fetch(`${API_ENDPOINT}/oauth2/token`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: payload
    })
    const tokenData = await data.json();
    const {token_type, access_token, refresh_token} = tokenData;

    if(access_token && access_token !== null) {
      const discordProfile = await fetchDiscordProfile(db, tokenData);
      const userProfile = await putProfile(db, discordProfile);

      console.log(userProfile);
     
      const responseObj = {
        status: {
          code: 'success',
          message: 'Successfully logged in'
        },
        userData: {
          id: userProfile.id,
          username: userProfile.username,
          avatar: userProfile.avatar,
          access_token: userProfile.access_token
        }
      }

      res.send(responseObj);
    }
    else {
      res.send({
        status: {
          code: 'failed',
          message: 'Problem fetching tokens from Discord'
        }
      });
    }

    
  });

  router.post('/OAuth', async (req, res) => {
    res.send(await checkAuthentication(db, req.body.access_token));
  }); 

  return router;
}