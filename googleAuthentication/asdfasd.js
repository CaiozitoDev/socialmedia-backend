const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const findOrCreate = require('mongoose-findorcreate')



passport.serializeUser((user, done) => {
    done(null, user.id)
})

passport.deserializeUser(function(id, done) {
    usersCollection.findById(id, function(err, user) {
      done(err, user);
    });
  });



passport.use(new GoogleStrategy({
    clientID: '11373474597-2i04h7rki3n07o92tdr7uag3nlj5ouqq.apps.googleusercontent.com',      // CHAVES DE AUTENTICAÇÃO CEDIDAS PELA API CRIADA NO GOOGLE DEVELOPERS WEBSITE
    clientSecret: 'fo2Za5Att-mPQRvU8KHCYaRT',
    callbackURL: "http://localhost:3000/auth/google/home",  // PRA ONDE O GOOGLE VAI RETORNAR QUANDO AUTENTICAR A CONTA NA SESSÃO DE LOGIN
    },
    function(accessToken, refreshToken, profile, cb) {
        usersCollection.findOrCreate({ googleId: profile.id }, function (err, user) {  // FINALMENTE USANDO A FUNÇÃO CRIADA COM O PACOTE findOrCreate PRA
            console.log('oooooooooooooooooosdfgsdfgsdfgsdfg')
            return cb(err, user);                                                       // NO BANCO DE DADOS O PROFILE ID DA PESSOA QUE LOGOU COM A CONTA 
        });
    }
))


 


app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile'] }))   // SERVE PRA CHAMAR A API DO GOOGLE DE LOGIN (COM O ESCOPO DE CONTAS)


app.get('/auth/google/home', 
passport.authenticate('google', { failureRedirect: '/login' }),  // RESPOSTA DO SERVER QUANDO O GOOGLE AUTENTICAR E REDIRECIONAR PARA ESSA ROTA
function(req, res) {
  // Successful authentication, redirect secrets.
  res.redirect('/home');
})

