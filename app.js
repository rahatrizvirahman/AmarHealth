var express = require("express")
var mongoose = require("mongoose")
var bodyParser = require("body-parser")
var flash = require('connect-flash')
var session = require("express-session")
var passport = require("passport")
var medHistoryModel = require('./models/medHistoryInfo')

var displayName = ''

//import camelCase function
const camelCase = require('./controllers/functionCollection').camelCase

require("dotenv").config()

// Passport Config
require('./controllers/passport')(passport)

var database_controller = require("./controllers/database_controller")

var app = express()


app.use("/assets", express.static(__dirname + "/public"))
app.use("/resources", express.static(__dirname + "/resources"))

//setting ejs as view engine
app.set("view engine", "ejs")

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

// Express session
app.use(
  session({
    secret: "secret care",
    resave: true,
    saveUninitialized: true
  })
)

// Passport middleware
app.use(passport.initialize())
app.use(passport.session())

// Connect flash
app.use(flash())

mongoose
  .connect(
    "mongodb+srv://user1:987654321@cluster0-t11g2.mongodb.net/keepLearning?retryWrites=true&w=majority",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false
    }
  )
  .then(() => console.log("connected to database!!"))
  .catch(err => console.log(err))

  // Global variables
app.use(function(req, res, next) {
  res.locals.success_msg = req.flash('success_msg')
  res.locals.error_msg = req.flash('error_msg')
  res.locals.error = req.flash('error')
  next()
})

app.get("/home", async (req, res) => {
  if(req.user)
    displayName = req.user.name.displayName
  else displayName = ''
   res.render("home", {displayName})
})

app.get("/", async (req, res) => {
  if(req.user)
    displayName = req.user.name.displayName
  else displayName = ''
   res.render("home", {displayName})
})


app.get("/test", async (req, res) => {
  res.render("test")
})

let substanceTypes = [['Alcohol'],
                      ['Marijuana', 'Hashish', 'Hash oil'],
                      ['Cocaine', 'Crack', 'Methamphetamine'],
                      ['Ritalin', 'Benzedrine', 'Dexedrine'],
                      ['Valium', 'Librium', 'Halcion', 'Xanax', 'Diazepam', 'Roofies'],
                      ['Amytal', 'Seconal', 'Dalmane', 'Quaalude', 'Henobarbital'],
                      ['Heroin'],
                      ['Street or illicit methadone'],
                      ['Tylenol #2 and #3', '282’S', '292’S', 'Percodan', 'Percocet', 'Opium', 'Morphine', 'Demerol', 'Dilaudid'],
                      ['LSD', 'PCP', 'STP', 'MDA', 'DAT', 'Mescaline', 'Peyote', 'Mushrooms', 'Ecstasy (MDMA)', 'Nitrous oxide'],
                      ['Glue', 'Gasoline', 'Aerosols', 'Paint thinner', 'Poppers', 'Rush', 'Locker room']
                      ]
                      
let substanceNames = ['Alcohol','Cannabis','Stimulants','Amphetamines','Benzodiazepines/tranquilizers','Sedatives/hypnotics','Heroin','Street or illicit methadone','Opioids','Hallucinogens','Inhalants']

var substanceNamesJson=[]
for(var i=0; i<substanceNames.length; i++){
  substanceNamesJson.push({
    name: substanceNames[i],
    types: substanceTypes[i]
  })
}

//console.log(substanceNamesJson)

app.get("/medHistory", async (req, res) => {
  res.render("medHistory",
  {
    substanceNamesJson
  })
})

let diseases = ["High Blood Pressure", "Diabetes", "Asthma", "Schizophrenia", "Glaucoma", "Heart Attack", "Tuberculosis", "Alzheimer Disease", "Migraine", "Cancer", "Eczema", "Chromosomal Abnormality", "Stroke", "Depression", "Hay Fever", "Thalassemia" ]
let diseasesJson = []
for(var i=0; i<diseases.length; i++) {
  diseasesJson.push({
    name: diseases[i],
    id: camelCase(diseases[i])})
}

app.get("/medHistory", async (req, res) => {

  await medHistoryModel.find({},(err, data) => {
    if (err) throw err
    else res.render("medHistory", { data, diseasesJson})
  })

})
app.get("/profile", async (req, res) => {

  res.render("profile")

})

app.post("/medHistory", async (req, res) => {
    var userData = new medHistoryModel({
      _someId: req.body.ObjectId
  })
  await userData.save( (err, data) => {
      if(err) console.error(err)
      console.log(' data with this id is saved')
  })
  res.redirect('/medHistory')
})




//routes
app.use("/data", require("./routes/data.js"))
app.use("/auth", require("./routes/auth.js"))

database_controller(app)



var PORT = process.env.PORT || 5000
// app.listen(PORT)
app.listen(PORT, () => {
  console.log('Express server listening on port', PORT)
})