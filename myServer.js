const application_root=__dirname,
    express = require("express"),
    path = require("path"),
    bodyparser=require("body-parser");

const db=require('./myStorage');
const contr=require('./controllers');

var app = express();
app.use(express.static(path.join(application_root,"public")));
app.use(bodyparser.urlencoded({extended:true}));
app.use(bodyparser.json());

//Cross-domain headers
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});


var DB=new myDB('./data');

app.get('/',function(req,res){
    res.sendFile("public/index.html",{root:application_root});
});

//Grafo de datainfo
app.get('/stream/graph',function(req,res){
    contr.getGraph(function(data){
      res.send(data);
    })
});

app.get('/dataset',function(req,res){
    res.send({result: DB.getDatasets()});
});

app.get('/dataset/:name',function(req,res){
    var n = (req.query.n == null) ? 10 : parseInt(req.query.n);
    DB.getLastObjects(req.params.name,n,function(data){
        res.send(data);
    })
});

app.get('/stream/:name/polaridad',function(req,res){
  contr.getSentimentTweets(req.params.name,function(data){
    res.send(data);
  })
});

app.get('/stream/:name/geo',function(req,res){
  contr.getGeoLocationTweets(req.params.name,function(data){
    res.send(data);
  })
});

//Aqui hay que sacar el top=2 de la url y pasarla al método getHistogramTweets
app.get('/stream/:name/words',function(req,res){
  contr.getHistogramTweets(req.params.name,req.query.top,function(data){
    res.send(data);
  })
});

//Aqui hay que sacar el limit=2 de la url y pasarla al método getHistogramTweets
app.get('/stream/:name',function(req,res){
  contr.getIdStreamsTweets(req.params.name,req.query.limit,function(data){
    res.send(data);
  })
});


//Levanta el servidor cuando la BD este lista
db.warmupEmmitter.once("warmup",() => {
   console.log("Web server running on port 8000");
   app.listen(8080, function(){
      console.log("the server is running!");
   });
});


