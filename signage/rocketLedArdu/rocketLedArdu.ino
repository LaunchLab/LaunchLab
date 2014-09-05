#include <aJSON.h>
aJsonStream serial_stream(&Serial);

int rocketled = 9;           // the pin that the LED is attached to
int brightness = 0;    // how bright the LED is
int fadeAmount = 5;    // how many points to fade the LED by

int testled = 13;

void setup(void) {
 Serial.begin(9600);
 pinMode(rocketled, OUTPUT);
 pinMode(testled, OUTPUT);
}

void loop(void) {
  
  //recieve commands
  while (serial_stream.available()) 
  {
    aJsonObject *msg = aJson.parse(&serial_stream);
    processMessage(msg);  //see api.ino
    aJson.deleteItem(msg);  
  } 

  // set the brightness of pin 9:
  analogWrite(rocketled, brightness);    

  // change the brightness for next time through the loop:
  brightness = brightness + fadeAmount;

  // reverse the direction of the fading at the ends of the fade: 
  if (brightness == 0 || brightness == 255) {
    fadeAmount = -fadeAmount ; 
  }     
  // wait for 30 milliseconds to see the dimming effect    
  delay(30);   
}

/* ================================================================== 

 Expects something like this over serial:
 
 {"brightness": "0.1"}
 {"request": "light"}
 {"brightness": "0.5", "request":"light"}

*/

void processMessage(aJsonObject *msg)
{

  aJsonObject *led = aJson.getObjectItem(msg, "led");
  if (led) {
    char* ledvaluestring = led->valuestring;
    float ledvaluefloat = atof(ledvaluestring); 
    int ledvalueint = ledvaluefloat;
    
    analogWrite(rocketled, 255); 
    delay(250);
    analogWrite(rocketled, 0);
    delay(250);
    analogWrite(rocketled, 255);
    delay(250);
    analogWrite(rocketled, 0);    
    
  }
  
}

