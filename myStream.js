const Twitter = require('twitter')
const myCreds = require('./credentials/my-credential.json');
const client = new Twitter(myCreds);
const sentiment = require('sentiment-spanish');
const contr = require('./controllers');
const mng=require('mongoose');
const my_conn_data="mongodb://putosamos:patatafrita@ds133231.mlab.com:33231/mydbtwitter";
//Creamos la conexion con nuestra base de datos
mng.connect(my_conn_data);

var db=require('./myStorage'),
        DB=new myDB('./data'),
        util=require('util')

var itemSchema = new mng.Schema({
  "@context": String,
  "@type": String,
  "identifier": String,
  "query": String,
  "agent": String,
  "startTime": Date,
  "@id": String
});

var ItemModel = mng.model('Item', itemSchema);


class StreamManager{
     constructor(){
        this.streams={} //this.streams['coches']=stream object
     }

     addStream(name,query){
        var stream = client.stream('statuses/filter', {track: query});
        var jsonld=contr.createJSONLD(name, query);
        var metadato=new ItemModel(jsonld);
        metadato.save();
      	DB.createDataset(name, contr.createJSONLD(name, query));
        this.streams[name] = stream;
        stream.on('data', function(tweet) {
            //filter lang here?
            console.log('ID -> '+tweet.id_str);
            console.log('Coordenadas -> '+tweet.coordinates);
            console.log(name +' -> '+ tweet.text);
            console.log('Polaridad -> '+sentiment(tweet.text).score);
	          DB.insertObject(name, {'id':tweet.id_str,
				                           'coordenadas':tweet.coordinates,
				                           'texto':tweet.text,
				                           'polaridad':sentiment(tweet.text).score});
        });
 
        stream.on('error', function(err){
            console.log(err);
        });

     }

     deleteStream(name){
       //delete la key y destruye el objeto stream
       this.streams[name].destroy();
       delete this.streams[name];
     }

}

exports.StreamManager = StreamManager;

var my = new StreamManager();
my.addStream('coches3','opel,mercedes,bmw');
my.addStream('perros peligrosos3','rotwiller, pitbull'); 
setTimeout(()=>{my.deleteStream('coches3')},100000);
setTimeout(()=>{my.deleteStream('perros peligrosos3')},100000);

