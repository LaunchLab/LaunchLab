var SerialPort = require("serialport"); // so we can access the serial port
var scraper = require('json-scrape')(); // cleans messy serial messages.

//LIST DEVICES
SerialPort.list( function (err, ports) {
	//todo autodetect
	console.log("========================")
	console.log(ports)
	console.log("========================")
	for (var num in ports) {
		console.log(ports[num])
	}
});


//CONNECT
var arduino = new SerialPort.SerialPort('/dev/cu.usbmodem1441', {baudrate: 9600}); //you must set the port and baudrate

var arduConnect = function (device) {
	device.on("data", datahandler);
}

var datahandler = function (data) {
	//console.log(data.toString())
	//var strdata = data.toString()
	scraper.write(data); 
}

scraper.on('data', function (cleandata) {
	console.log(cleandata)		
});

arduConnect(arduino);




  var socket = require('socket.io-client')('http://launchlabapp.com');

  socket.on('connect', function(){
  	console.log("CONNECTED")
  	


  });

      socket.on('activity', function(data){
    	console.log("ACTIVITY")
    	console.log(data);
    	var toardu = JSON.stringify(data);
    	arduino.write(toardu)
    });