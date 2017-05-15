const gb=require('glob');
const fs=require('fs');
const sf=require('slice-file');

const events = require('events');

var warmupEmmitter = new events.EventEmitter();

myDB = function(dataDir) {
        this.dataDir=dataDir+"/";
        this.datasets=[];
        this.lastID=0;
        this.count={};
        this.warmup();
}


myDB.prototype.getDatasetInfo= function(name,callback){
    if (this.datasets.indexOf(name) !== -1 ){
        xs = sf(this.filename(name));
        var lista=[];
        xs.slice(0,1)
        .on('data',function(chunk){
            object=JSON.parse(chunk.toString().trim());
            if (object._type=="metadata"){
                lista.push(JSON.parse(chunk.toString().trim()))
            } 
        })
        .on('end',function(){
               var aux=lista[0];
               callback({result: aux},name);
        });
      }
      else{callback({error:'no valid dataset '+name},name);}
}


myDB.prototype.warmup = function(){
     var dataDir=this.dataDir;
     var files= gb.glob(this.dataDir+'*.data',{sync:true});
     var self=this;
     
     self.datasets=files.map(function(e){
                     return e.trim().replace(dataDir,"").replace(".data","")
      });

      
     var promises=self.datasets.map(function(name){

              return new Promise((resolve,reject) => {
                      self.getCount(name,function(count,name){resolve([name,count]) });
               });

      });

     Promise.all(promises).then(values => {
            values.forEach(function(x){self.count[x[0]]=x[1]});
            warmupEmmitter.emit('warmup');
     });

}

myDB.prototype.getDatasets = function(){
      return this.datasets;
}

myDB.prototype.filename = function(name){
	   return this.dataDir+name+".data";
}

myDB.prototype.getTimeStamp = function(){
     var date=new Date().toISOString();
     return date;
}

myDB.prototype.createDataset = function(name,data){
     if (this.datasets.indexOf(name) === -1){
         this.datasets.push(name);
         this.count[name]=0;
         data._type="metadata";
         data._n=0;
         data._dt=this.getTimeStamp();
         fs.appendFileSync(this.filename(name),JSON.stringify(data)+"\n");
         return true;
      }
      else return false;
}

myDB.prototype.insertObject = function(name,data){

      if (this.datasets.indexOf(name) === -1 ){
        return false;
      }

      data._dt=this.getTimeStamp();
      data._id=this.lastID;
      this.lastID=data._id+1;
      if (this.count[name]!== null){
         this.count[name]++;
         data._n=this.count[name];
      } else {
         return false;
       }

      fs.appendFileSync(this.filename(name),JSON.stringify(data)+"\n");

      return true;
}

myDB.prototype.getCount = function(name, callback){
    if (this.datasets.indexOf(name) !== -1 ){
        var xs = sf(this.filename(name));
        var lista=[];
        xs.slice(-1)
          .on('data',function(chunk){
              var data=JSON.parse(chunk.toString().trim());
              callback(data._n,name) 
          });
      }
      else callback(0,name)
}

myDB.prototype.getLastObjects = function(name, n, callback){
    if (this.datasets.indexOf(name) !== -1 ){
        xs = sf(this.filename(name));
        var lista=[];
        if (n>this.count[name]) n=0;
        xs.slice(-n)
        .on('data',function(chunk){
            object=JSON.parse(chunk.toString().trim());
            if (!(object._type !== null && object._type === "metadata")){
                lista.push(JSON.parse(chunk.toString().trim()))
            } 
        })
        .on('end',function(){
          callback({result: lista},name)
        });
      }
      else callback({error:'no valid dataset '+name},name);
}

myDB.prototype.deleteDataset = function(name){
    if (this.datasets.indexOf(name) !=-1 ){
        fs.unlinkSync(this.filename(name));
        this.datasets.splice(this.datasets.indexOf(name),1);
        return true;
      }
    else {return false; }

}

exports.myDB = myDB;
exports.warmupEmmitter = warmupEmmitter;

