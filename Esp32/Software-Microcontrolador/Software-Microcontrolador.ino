/*UNIVERSIDADE EDUARDO MONDLANE

  TRABALHO DE LICENCIATURA

  Desenvolvimento de um Sistema de Rastraemento Solar, baseado em IoT, para Monitoramento e Controlo Remoto de Painel Solar

  Pedro, Elves Benjamim
*/

#include <Adafruit_BMP280.h>
#include <Adafruit_GFX.h>
#include <Adafruit_QMC5883P.h>
#include <Adafruit_ST7735.h>
#include <ArduinoJson.h>
#include <BH1750.h>
#include <cstdio>
#include <cstring>
#include <ESP32Servo.h>
#include <math.h>
#include <Preferences.h>
#include <PubSubClient.h>
#include <SPI.h>
#include <sys/time.h>
#include <time.h>
#include <TinyGPSPlus.h>
#include <WiFi.h>
#include <Wire.h>



// GPS PINS
#define GPS_RX 16
#define GPS_TX 17

// BH1750 AND GY-91 PINS
#define SDA 21
#define SCL 22

// DISPLAY TFT LCD PINS
#define TFT_CS    27
#define TFT_RST   25
#define TFT_DC    26
#define TFT_MOSI  33
#define TFT_SCLK  32

// SERVO PINS
#define AZIMUTH_PIN  19
#define ELEVATION_PIN 18

// SENSORS PINS
#define CURRENT_PIN 34
#define VOLTAGE_PIN 35

// NOTIFICATION AREA
#define NOTIF_X 2
#define NOTIF_Y 20
#define NOTIF_W 56
#define NOTIF_H 10
#define ICON_SIZE 8
#define ICON_SPACING 4
#define NOTIF_DURATION 2000UL

// MPU ADDRESS
#define MPU_ADDR 0x68

// ANALOG DATA
#define VOLTAGE_DIVIDER_RATIO (53.2 / 6.6)
#define CURRENT_DEADBAND 0.030
#define CURRENT_DIVIDER_RATIO (25.0 / 15.0)
#define ACS712_SENSITIVITY 0.185


// WIFI CONFIG
const char* ssid = "Redmi Note 13";
const char* password = "18112002";

// MQTT CONFIG
const char* mqtt_broker = "10.120.126.27";
const uint16_t mqtt_port = 1883;
const char* PANEL = "decfe0ec-3d71-4486-9f1a-15873081d0d8";
const char* USER = "a3e58b4c-844b-43ea-a46c-897dc36414aa";

//TOPICS MQTT SUB
String topicSunservice =
    "solar/" + String(PANEL) + "/sunservice";
String topicControl =
    "solar/" + String(PANEL) + "/control";
String topicPong = 
    "solar/" + String(PANEL) + "/pong";

//TOPICS MQTT PUB
String topicInfo =
    "solar/" + String(USER) + "/" + String(PANEL) + "/info";
String topicDashboard =
    "solar/" + String(USER) + "/" + String(PANEL) + "/dashboard";
String topicPing = 
    "solar/" + String(USER) + "/" + String(PANEL) + "/ping";

// MQTT CLIENT
WiFiClient espClient;
PubSubClient client(espClient);
unsigned long lastPublish = 0;
unsigned long lastUpdate = 0;
unsigned long lastMQTTCheck = 0;
unsigned long pingStart = 0;
unsigned long lastPing = 0;
uint32_t lastPublishedDate = 0;
uint32_t pingId = 0;
const unsigned long publishInterval = 5000;
const unsigned long updateInterval = 500;
const unsigned long PING_INTERVAL = 5000;
const unsigned long PING_TIMEOUT = 3000;
bool pingPending = false;

// NOTIFICATION TYPE
enum NotificationType {
  NOTIF_SUNSERVICE,
  NOTIF_CONTROL,
  NOTIF_INFO,
  NOTIF_DASHBOARD,
  NOTIF_COUNT
};

// NOTIFICATION STATE
bool notificationVisible[NOTIF_COUNT] = {false, false, false, false};
unsigned long notificationTime[NOTIF_COUNT] = {0, 0, 0, 0};

//DISPLAY INIT
Adafruit_ST7735 tft = Adafruit_ST7735(
  TFT_CS,
  TFT_DC,
  TFT_RST
);

unsigned long previousCalibrationDisplay = 0;
const unsigned long CALIBRATION_DISPLAY_INTERVAL = 500;
bool calibrationScreenInitialized = false;

// SERVOS
Servo servoAzimuth;
Servo servoElevation;

float azimuth = 90.0;
float azimuthD = 00.0;
float elevation = 90.0;
float sensor_azimuth = 999.0;
float sensor_elevation = 0.0;
float servoAzCommand = 90.0;
bool orientationReady = false;
const float CALIBRATION_TOLERANCE = 1.0;
unsigned long lastServoMovement = 0;
const float AZ_SERVO_MIN = 0.0;
const float AZ_SERVO_MAX = 180.0;
const float ELTOLERANCE = 3.3;
const float ELVELOCITY = 6;
const float EL_MIN_SPEED = 5.0;
const float EL_SERVO_MIN = 0.0;
const float EL_SERVO_MAX = 100.0;
const float STOP = 90.0;

// SENSORS
float voltage = 0.0;
float current = 0.0;
float temperature = 0.0;
float pressure = 0.0;
float luminosity = 0.0;
bool automaticMode = true;

float currentZeroVoltage = 2.5;

// GPS
HardwareSerial GPSserial(2);
TinyGPSPlus gps;
Preferences preferences;
double latitude =  -25.94255;
double longitude = 32.540419;
bool locationAvailable = false;
bool locationFromGPS = false;
double savedLatitude = 0.0;
double savedLongitude = 0.0;
unsigned long lastLocationSave = 0;
int gpsHour = 0;
int gpsMinute = 0;
int gpsSecond = 0;
int day = 01;
int month = 01;
int year = 26;
String sunset = "";
String sunrise = "";
String sunsetFormated = "";
String sunriseFormated = "";
int sunriseSeconds = 0;
int sunsetSeconds = 0;

const char* TIME_ZONE = "CAT-2";

// NTP SERVERS
const char* NTP_SERVER_1 = "pool.ntp.org";
const char* NTP_SERVER_2 = "time.google.com";

// CLOCK STATUS
enum TimeSource {
    TIME_NONE,
    TIME_GPS,
    TIME_NTP,
    TIME_INTERNAL
};

TimeSource currentTimeSource = TIME_NONE;
bool timeInitialized = false;
unsigned long lastGPSTimeUpdate = 0;
unsigned long lastNTPAttempt = 0;
unsigned long lastClockDisplay = 0;
const unsigned long GPS_UPDATE_INTERVAL = 1000;
const unsigned long NTP_RETRY_INTERVAL = 30000;
const unsigned long CLOCK_DISPLAY_INTERVAL = 1000;

// I2C DEVICES
BH1750 bh1750;
Adafruit_BMP280 bmp280;
Adafruit_QMC5883P qmc;

float ax, ay, az;
float gx, gy, gz;
float mx, my, mz;


// MPU SETTINGS
bool readMPURegister(
  uint8_t reg,
  uint8_t *data,
  uint8_t length
) {
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(reg);

  if (Wire.endTransmission(false) != 0) {
    return false;
  }

  uint8_t n = Wire.requestFrom(
    MPU_ADDR,
    length,
    (uint8_t)true
  );

  if (n != length) {
    return false;
  }

  for (uint8_t i = 0; i < length; i++) {
    data[i] = Wire.read();
  }

  return true;
}

bool writeMPURegister(uint8_t reg, uint8_t value) {
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(reg);
  Wire.write(value);

  return Wire.endTransmission() == 0;
}

bool initMPU() {
  uint8_t id;

  if (!readMPURegister(0x75, &id, 1)) {
    Serial.println("Erro na leitura WHO_AM_I do MPU6500");
    return false;
  }

  Serial.printf("MPU WHO_AM_I: 0x%02X\n", id);

  if (id != 0x70) {
    Serial.println("Identificador diferente do esperado");
    return false;
  }

  // Sair do modo Sleep
  if (!writeMPURegister(0x6B, 0x00)) {
    return false;
  }

  delay(100);

  // Acelerometro: escala de +/- 2 g
  if (!writeMPURegister(0x1C, 0x00)) {
    return false;
  }

  // Giroscopio: escala de +/- 250 graus/s
  if (!writeMPURegister(0x1B, 0x00)) {
    return false;
  }

  return true;
}

bool readMPU() {
  uint8_t data[14];

  if (!readMPURegister(0x3B, data, 14)) {
    return false;
  }

  int16_t rawAX =
    (int16_t)((data[0] << 8) | data[1]);

  int16_t rawAY =
    (int16_t)((data[2] << 8) | data[3]);

  int16_t rawAZ =
    (int16_t)((data[4] << 8) | data[5]);

  int16_t rawGX =
    (int16_t)((data[8] << 8) | data[9]);

  int16_t rawGY =
    (int16_t)((data[10] << 8) | data[11]);

  int16_t rawGZ =
    (int16_t)((data[12] << 8) | data[13]);

  // Conversao para g
  ax = rawAX / 16384.0f;
  ay = rawAY / 16384.0f;
  az = rawAZ / 16384.0f;

  // Conversao para graus/s
  gx = rawGX / 131.0f;
  gy = rawGY / 131.0f;
  gz = rawGZ / 131.0f;

  return true;
}


// BH1750 SETTINGS
bool initBH1750() {
  if (bh1750.begin(BH1750::CONTINUOUS_HIGH_RES_MODE)){
    return true;
  } else {
    return false;
  }
}


//BMP280 SETTINGS
bool initBMP280() {
  if (bmp280.begin(0x76)) {
    bmp280.setSampling(
      Adafruit_BMP280::MODE_NORMAL,
      Adafruit_BMP280::SAMPLING_X2,
      Adafruit_BMP280::SAMPLING_X16,
      Adafruit_BMP280::FILTER_X16,
      Adafruit_BMP280::STANDBY_MS_500
    );

    return true;
  } else {
    return false;
  }
}


// QMC SETTINGS
bool initQMC() {
  if (!qmc.begin(0x2C, &Wire)) {
    Serial.println("Falha na inicializacao do QMC5883P");
    return false;
  }

  qmc.setRange(QMC5883P_RANGE_8G);
  qmc.setMode(QMC5883P_MODE_NORMAL);
  qmc.setODR(QMC5883P_ODR_50HZ);

  return true;
}

bool readQMC() {
  return qmc.getGaussField(&mx, &my, &mz);
}


// LOATION CONFIG
void loadSavedLocation() {
  preferences.begin("solar-tracker", false);
  bool exists = preferences.getBool("loc_valid", false);

  if (exists) {
    latitude = preferences.getDouble("latitude", -25.94255);
    longitude = preferences.getDouble("longitude", 32.540419);
    preferences.end();

    savedLatitude = latitude;
    savedLongitude = longitude;

    locationAvailable = true;
    locationFromGPS = false;

    Serial.println("Localizacao recuperada da memoria!");

    Serial.print("Latitude: ");
    Serial.println(latitude, 6);

    Serial.print("Longitude: ");
    Serial.println(longitude, 6);
  }
  else {
    locationAvailable = false;
    preferences.end();
    Serial.println("Nenhuma localizacao guardada.");
  }
}

void saveLocation() {
  preferences.putDouble("latitude", latitude);
  preferences.putDouble("longitude", longitude);
  preferences.putBool("loc_valid", true);

  savedLatitude = latitude;
  savedLongitude = longitude;

  lastLocationSave = millis();

  Serial.println("Localizacao guardada na memoria!");
}

void updateGPSLocation() {
  while (GPSserial.available()) {

    char c = GPSserial.read();
    gps.encode(c);
  }

  if (!gps.location.isValid())
    return;

  if (gps.location.age() > 5000)
    return;

  double newLatitude = gps.location.lat();
  double newLongitude = gps.location.lng();

  latitude = newLatitude;
  longitude = newLongitude;

  locationAvailable = true;
  locationFromGPS = true;

  if (savedLatitude == 0.0 &&
      savedLongitude == 0.0) {

    saveLocation();
    publishInfo();
    return;
  }

  double distance = TinyGPSPlus::distanceBetween(
    savedLatitude,
    savedLongitude,
    latitude,
    longitude
  );

  if (distance >= 10.0) {
    saveLocation();
    publishInfo();
  }
}



// ELEVATION CALCULATION
void calculateElevation() {
  /*float magnitude = sqrt(
    ax * ax +
    ay * ay +
    az * az
  );

  if (magnitude < 0.1f) {
    return;
  }

  float nx = ax / magnitude;
  float ny = ay / magnitude;
  float nz = az / magnitude;

  sensor_elevation = 90 - atan2(
    nx,
    sqrt(ny * ny + nz * nz)
  ) * 180.0f / PI;*/

  sensor_elevation = atan2f(-ax, az) * 180.0f / PI + 90.0f;
}


// AZIMUTH CALCULATION
void calculateAzimuth() {
  /*float magnitude = sqrt(
    ax * ax +
    ay * ay +
    az * az
  );

  if (magnitude < 0.1f) {
    return;
  }

  float nx = ax / magnitude;
  float ny = ay / magnitude;
  float nz = az / magnitude;

  float horizontalX =
    mx * (1.0f - nx * nx) -
    my * nx * ny -
    mz * nx * nz;

  float horizontalY =
    mx * (1.0f - ny * ny) -
    my * nx * ny -
    mz * ny * nz;

  sensor_azimuth = atan2(
    horizontalY,
    horizontalX
  ) * 180.0f / PI;

  if (sensor_azimuth < 0) {
    sensor_azimuth += 360.0f;
  }

  if (sensor_azimuth >= 360.0f) {
    sensor_azimuth -= 360.0f;
  }*/

  sensor_azimuth = atan2(my, mx) * (180 / PI) - 12.0f;

  if (sensor_azimuth < 0) {
    sensor_azimuth += 360.0f;
  }
}

float convertAzimuth(float solarAzimuth){
  float azimuthc = 90.0f - solarAzimuth;
  if (azimuthc < 0.0f) {
    azimuthc += 360.0f;
  }
  return constrain(azimuthc, 0.0f, 180.0f);
}


// TIME CONFIG
void configureTimeZone() {
    setenv("TZ", TIME_ZONE, 1);
    tzset();
}

time_t convertToUnixTime(
    int year,
    int month,
    int day,
    int hour,
    int minute,
    int second
) {
  int y = year;
  int m = month;

  y -= (m <= 2);

  int era = (y >= 0 ? y : y - 399) / 400;
  unsigned int yearOfEra = y - era * 400;

  unsigned int dayOfYear =
    (153 * (m + (m > 2 ? -3 : 9)) + 2) / 5
    + day - 1;

  unsigned int dayOfEra =
    yearOfEra * 365
    + yearOfEra / 4
    - yearOfEra / 100
    + dayOfYear;

  long days = era * 146097L + dayOfEra - 719468L;

  time_t timestamp = (time_t)days * 86400L;

  timestamp += hour * 3600L;
  timestamp += minute * 60L;
  timestamp += second;

  return timestamp;
}

bool synchronizeTimeGPS() {
  if (!gps.date.isValid() || !gps.time.isValid()) {
    return false;
  }

  if (gps.date.age() > 5000 || gps.time.age() > 5000) {
    return false;
  }

  time_t utcTimestamp = convertToUnixTime(
    gps.date.year(),
    gps.date.month(),
    gps.date.day(),
    gps.time.hour(),
    gps.time.minute(),
    gps.time.second()
  );

  struct timeval tv;

  tv.tv_sec = utcTimestamp;
  tv.tv_usec = 0;

  if (settimeofday(&tv, nullptr) != 0) {
    return false;
  }

  currentTimeSource = TIME_GPS;
  timeInitialized = true;

  return true;
}

bool synchronizeTimeNTP() {
  if (WiFi.status() != WL_CONNECTED) {
    return false;
  }

  configureTimeZone();

  configTzTime(
    TIME_ZONE,
    NTP_SERVER_1,
    NTP_SERVER_2
  );

  struct tm timeInfo;

  if (!getLocalTime(&timeInfo, 10000)) {
    return false;
  }

  currentTimeSource = TIME_NTP;
  timeInitialized = true;

  return true;
}

void updateSystemTime() {
  unsigned long now = millis();

  if (now - lastGPSTimeUpdate >= GPS_UPDATE_INTERVAL) {
    lastGPSTimeUpdate = now;

    if (synchronizeTimeGPS()) {
        currentTimeSource = TIME_GPS;
    }
  }

  bool gpsTimeAvailable =
    gps.date.isValid() &&
    gps.time.isValid() &&
    gps.date.age() <= 5000 &&
    gps.time.age() <= 5000;

  if (!gpsTimeAvailable &&
    WiFi.status() == WL_CONNECTED &&
      (currentTimeSource != TIME_NTP ||
        !timeInitialized) &&
      now - lastNTPAttempt >= NTP_RETRY_INTERVAL) {

    lastNTPAttempt = now;

    if (synchronizeTimeNTP()) {
      currentTimeSource = TIME_NTP;
    }
  }

  if (!gpsTimeAvailable &&
      currentTimeSource == TIME_GPS &&
      timeInitialized) {

    currentTimeSource = TIME_INTERNAL;
  }

  if (!timeInitialized) {
      currentTimeSource = TIME_NONE;
  }
}

void checkNewDay() {
  struct tm timeinfo;

  if (!getLocalTime(&timeinfo, 0)){
    return;
  }
  if(timeinfo.tm_year + 1900 <2025){
    return;
  }

  uint32_t currentDate =  
        (timeinfo.tm_year + 1900) * 10000UL 
        + (timeinfo.tm_mon + 1) * 100UL 
        + timeinfo.tm_mday;

  bool isNewDay = currentDate == lastPublishedDate;

  if (!isNewDay || sunset.length() < 1 || sunrise.length() < 1) {
    publishInfo();
    lastPublishedDate = currentDate;
  } 
}


// VERIFY DAYTIME
bool isDaytime() {
  if (!timeInitialized) return false;

  if (sunriseSeconds < 0 || sunsetSeconds < 0) {
    return false;
  }

  struct tm timeInfo;

  if (!getLocalTime(&timeInfo, 0)) {
    return false;
  }

  int currentSeconds =
      timeInfo.tm_hour * 3600 +
      timeInfo.tm_min * 60 +
      timeInfo.tm_sec;

  return currentSeconds >= sunriseSeconds &&
         currentSeconds < sunsetSeconds;
}


// PARSE ISO TIME
String getISOTime(String datetime, int& secondsOfDay){
  int pos = datetime.indexOf('T');
  if (pos == -1 || datetime.length() < pos + 9) {
    return "";
  }

  int hour, minute, second;
  if (sscanf(datetime.substring(pos + 1, pos + 9).c_str(), "%2d:%2d:%2d",
             &hour, &minute, &second)
      == 3) {
    if (hour >= 0 || hour <= 23 || minute >= 0 || minute <= 59 || second >= 0 || second <= 59) {
      secondsOfDay = hour * 3600 + minute * 60 + second;
    }
  }
  
  return datetime.substring(pos + 1, pos + 9);
}


// PANEL VOLTAGE
float getPanelVoltage() {
  const int samples = 50;
  uint32_t sum = 0;

  for (int i = 0; i < samples; i++) {
    sum += analogReadMilliVolts(VOLTAGE_PIN);
  }

  float adcVoltage = (sum / (float)samples) / 1000.0;
  float panelVoltage = adcVoltage * VOLTAGE_DIVIDER_RATIO;

  if ( abs(panelVoltage) <= 1.146) {
    panelVoltage = 0.0;
  }

  return panelVoltage;
}


// PANEL CURRENT
float getPanelCurrent() {
  const int samples = 200;
  uint32_t sum = 0;

  for (int i = 0; i < samples; i++) {
    sum += analogReadMilliVolts(CURRENT_PIN);
  }

  float adcVoltage = (sum / (float)samples) / 1000.0;
  float sensorVoltage = adcVoltage * CURRENT_DIVIDER_RATIO;
  float current = (sensorVoltage - currentZeroVoltage) / ACS712_SENSITIVITY;

  if (abs(current) < CURRENT_DEADBAND || abs(current) > 5000 || current < 0) {
    current = 0.0;
  }

  return current;
}

void calibrateCurrentSensor() {
  const int samples = 500;
  uint32_t sum = 0;

  for (int i = 0; i < samples; i++) {
    sum += analogReadMilliVolts(CURRENT_PIN);
  }

  float adcVoltage = (sum / (float)samples) / 1000.0;
  currentZeroVoltage = adcVoltage * CURRENT_DIVIDER_RATIO;
}


// WIFI CONNECT
void check_WiFi() {
  static unsigned long lastTry = 0;
  if(WiFi.status() == WL_CONNECTED) {
    return;
  }

  if (millis() - lastTry >= 10000) {
    lastTry = millis();

    WiFi.disconnect();
    WiFi.begin(ssid, password);
  }
}


// MQTT CONNECT
void check_MQTT() {
  if (WiFi.status() != WL_CONNECTED) {
    return;
  }

  if (client.connected()){
    return;
  }

  if (millis() - lastMQTTCheck < publishInterval){
    return;
  }

  lastMQTTCheck = millis();

  String clientID =
    "ESP-" + String((uint32_t)ESP.getEfuseMac(), HEX);

  if (client.connect(clientID.c_str())) {
    bool subSunservice = client.subscribe(topicSunservice.c_str());
    bool subControl = client.subscribe(topicControl.c_str());
    bool subPong = client.subscribe(topicPong.c_str());

    Serial.print("[MQTT] Subscricao sunservice: ");
    Serial.println(subSunservice ? "OK" : "FALHOU");

    Serial.print("[MQTT] Subscricao control: ");
    Serial.println(subControl ? "OK" : "FALHOU");

    Serial.print("[MQTT] Subscricao Pong: ");
    Serial.println(subPong ? "OK" : "FALHOU");
  } else {
    Serial.print("[MQTT] Falha. Estado do cliente: ");
    Serial.println(client.state());
  }
}


// CHECK MECANICAL CALIBRATION
void checkOrientationCalibration() {
  if (orientationReady) return;

  float diffAz2 = fabs(sensor_azimuth - 0.0);
  float diffAz1 = fabs(sensor_azimuth - 360.0);

  if (diffAz1 <= CALIBRATION_TOLERANCE ||
      diffAz2 <= CALIBRATION_TOLERANCE) {

    orientationReady = true;
    tft.fillScreen(ST77XX_BLACK);
    drawLayout();

    Serial.println("Calibracao concluida!");
    Serial.println("Sistema pronto para rastreamento.");
  }
}


// CHECK ANGLES
void checkAngles(){
  bool mpuValid = readMPU();
  bool qmcValid = readQMC();

  if (mpuValid && qmcValid) {
    calculateElevation();
    calculateAzimuth();
  } else {

    if (!mpuValid) {
      Serial.println("Erro na leitura do MPU6500");
    }

    if (!qmcValid) {
      Serial.println("Erro na leitura do QMC5883P");
    }
  }
}


// DRAW CALIBRATION SCREEN
void drawCalibrationScreen() {
  tft.fillScreen(ST77XX_BLACK);
  tft.setTextWrap(false);

  tft.setTextSize(1);
  tft.setTextColor(ST77XX_CYAN);
  tft.setCursor(12, 5);
  tft.print("SOLAR TRACKER");

  tft.drawFastHLine(0, 18, 160, ST77XX_WHITE);

  tft.setTextColor(ST77XX_WHITE);
  tft.setCursor(5, 25);
  tft.print("REFERENCIA SERVO");

  tft.setTextColor(ST77XX_GREEN);
  tft.setCursor(5, 40);
  tft.print("AZ: 90.0");

  tft.setCursor(70, 40);
  tft.print("EL: 90.0");

  tft.drawFastHLine(0, 57, 160, ST77XX_WHITE);

  tft.setTextColor(ST77XX_WHITE);
  tft.setCursor(5, 64);
  tft.print("ANGULOS DOS SENSORES");

  tft.setTextColor(ST77XX_YELLOW);

  tft.setCursor(5, 80);
  tft.print("AZ:");

  tft.setCursor(70, 80);
  tft.print("EL:");

  tft.drawFastHLine(0, 99, 160, ST77XX_WHITE);

  tft.setTextColor(ST77XX_YELLOW);
  tft.setCursor(5, 108);
  tft.print("CALIBRANDO...");

  calibrationScreenInitialized = true;
}


//UPDATE CALIBRATING SREEN
void updateCalibrationDisplay() {
  if (millis() - previousCalibrationDisplay <
      CALIBRATION_DISPLAY_INTERVAL) {
    return;
  }

  previousCalibrationDisplay = millis();

  if (!calibrationScreenInitialized) {
    drawCalibrationScreen();
  }

  checkAngles();

  // Actualizar azimute
  tft.fillRect(28, 78, 40, 15, ST77XX_BLACK);

  tft.setTextSize(1);
  tft.setTextColor(ST77XX_YELLOW);
  tft.setCursor(28, 80);

  if (isfinite(sensor_azimuth)) {
    tft.print(sensor_azimuth, 1);
    tft.print((char)247);
  } else {
    tft.print("---");
  }

  // Actualizar elevacao
  tft.fillRect(90, 78, 50, 15, ST77XX_BLACK);

  tft.setCursor(93, 80);

  if (isfinite(sensor_elevation)) {
    tft.print(sensor_elevation, 1);
    tft.print((char)247);
  } else {
    tft.print("---");
  }

  // Actualizar estado
  tft.fillRect(0, 101, 160, 27, ST77XX_BLACK);

  tft.setCursor(5, 108);

  if (orientationReady) {
    tft.setTextColor(ST77XX_GREEN);
    tft.print("CALIBRACAO OK");
  } else {
    tft.setTextColor(ST77XX_YELLOW);
    tft.print("CALIBRANDO...");
  }
}


// DRAW SUN ICON
void drawSun(int x, int y) {
  // Center
  tft.fillCircle(x, y, 4, ST77XX_YELLOW);

  // Ray
  tft.drawLine(x, y - 8, x, y - 6, ST77XX_YELLOW);
  tft.drawLine(x, y + 6, x, y + 8, ST77XX_YELLOW);
  tft.drawLine(x - 8, y, x - 6, y, ST77XX_YELLOW);
  tft.drawLine(x + 6, y, x + 8, y, ST77XX_YELLOW);
  tft.drawLine(x - 6, y - 6, x - 4, y - 4, ST77XX_YELLOW);
  tft.drawLine(x + 4, y + 4, x + 6, y + 6, ST77XX_YELLOW);
  tft.drawLine(x + 6, y - 6, x + 4, y - 4, ST77XX_YELLOW);
  tft.drawLine(x - 6, y + 6, x - 4, y + 4, ST77XX_YELLOW);
}


// DRAW STATUS DOT
void drawStatusDot(int x, int y, bool connected) {
  if (connected)
    tft.fillCircle(x, y, 3, ST77XX_GREEN);
  else
    tft.fillCircle(x, y, 3, ST77XX_RED);
}


// DRAW GPS DATA
void drawGPS() {
  tft.fillRect(58, 0, 73, 30, ST77XX_BLUE);

  // GPS HOUR AND DATE
  char hora[6];
  sprintf(hora, "%02d:%02d", gpsHour, gpsMinute);

  tft.setTextSize(2);
  tft.setTextColor(ST77XX_WHITE);
  tft.setCursor(60, 3);
  tft.print(hora);

  char date[9];
  sprintf(date, "%02d/%02d/%2d", day, month, year%2000);

  tft.setTextSize(1);
  tft.setTextColor(ST77XX_CYAN);
  tft.setCursor(65, 20);
  tft.print(date);

  tft.fillRect(86, 30, 40, 9, ST77XX_BLUE);

  // MODO
  tft.setCursor(87, 31);

  if (automaticMode) {
    tft.setTextColor(ST77XX_CYAN);
    tft.print("AUTO");
  } else {
    tft.setTextColor(ST77XX_YELLOW);
    tft.print("MANUAL");
  }
}


void updateClockVariables() {
  if (!timeInitialized) return;

  struct tm timeInfo;

  if (!getLocalTime(&timeInfo, 0)) return;

  gpsHour   = timeInfo.tm_hour;
  gpsMinute = timeInfo.tm_min;
  gpsSecond = timeInfo.tm_sec;

  day   = timeInfo.tm_mday;
  month = timeInfo.tm_mon + 1;
  year  = timeInfo.tm_year + 1900;
}


// DRAW HEADER
void drawHeader() {
  tft.fillRect(0, 0, 128, 40, ST77XX_BLUE);
  drawSun(6, 8);

  // SOLAR TRACKER
  tft.setTextSize(1);
  tft.setTextColor(ST77XX_YELLOW);
  tft.setCursor(19, 3);
  tft.print("SOLAR");

  tft.setTextColor(ST77XX_WHITE);
  tft.setCursor(15, 12);
  tft.print("TRACKER");

  drawGPS();

  // WIFI
  tft.setTextSize(1);
  tft.setTextColor(ST77XX_WHITE);
  tft.setCursor(2, 31);
  tft.print("WiFi");
  drawStatusDot(
    30,
    34,
    WiFi.status() == WL_CONNECTED);

  // MQTT
  tft.setCursor(45, 31);
  tft.print("MQTT");
  drawStatusDot(
    73,
    34,
    client.connected());
}


// NOTIFICATION ICON POSITION
int getIconX(NotificationType type) {
  return NOTIF_X + type * (ICON_SIZE + ICON_SPACING);
}


// SUNSERVICE ICON
void drawSunIcon(int x, int y) {
  uint16_t color = ST77XX_YELLOW;

  tft.drawPixel(x + 3, y + 3, color);
  tft.drawPixel(x + 4, y + 3, color);
  tft.drawPixel(x + 3, y + 4, color);
  tft.drawPixel(x + 4, y + 4, color);

  tft.drawPixel(x + 3, y, color);
  tft.drawPixel(x + 3, y + 7, color);
  tft.drawPixel(x, y + 3, color);
  tft.drawPixel(x + 7, y + 3, color);

  tft.drawPixel(x + 1, y + 1, color);
  tft.drawPixel(x + 6, y + 1, color);
  tft.drawPixel(x + 1, y + 6, color);
  tft.drawPixel(x + 6, y + 6, color);
}


// CONTROL ICON
void drawControlIcon(int x, int y) {
  uint16_t color = ST77XX_CYAN;

  tft.drawRect(x + 1, y + 1, 6, 6, color);
  tft.drawFastHLine(x + 2, y + 3, 4, color);
  tft.drawFastVLine(x + 3, y + 2, 4, color);
  tft.drawFastVLine(x + 5, y + 2, 4, color);
}


// INFO ICON
void drawInfoIcon(int x, int y) {
  uint16_t color = ST77XX_GREEN;

  tft.drawCircle(x + 3, y + 3, 3, color);
  tft.drawPixel(x + 3, y + 1, color);
  tft.drawFastVLine(x + 3, y + 3, 3, color);
}


// DASHBOARD ICON
void drawDashboardIcon(int x, int y) {
  uint16_t color = ST77XX_WHITE;

  tft.drawRect(x, y + 1, 8, 6, color);
  tft.drawPixel(x + 2, y + 5, ST77XX_GREEN);
  tft.drawLine(x + 2, y + 5, x + 4, y + 3, ST77XX_GREEN);
  tft.drawLine(x + 4, y + 3, x + 6, y + 4, ST77XX_GREEN);
}


// DRAW NOTIFICATION
void drawNotificationIcon(NotificationType type) {
  int x = getIconX(type);
  int y = NOTIF_Y + 1;

  switch (type) {
    case NOTIF_SUNSERVICE:
      drawSunIcon(x, y);
      break;

    case NOTIF_CONTROL:
      drawControlIcon(x, y);
      break;

    case NOTIF_INFO:
      drawInfoIcon(x, y);
      break;

    case NOTIF_DASHBOARD:
      drawDashboardIcon(x, y);
      break;

    default:
      break;
  }
}


// SHOW NOTIFICATION
void showNotification(NotificationType type) {
  notificationVisible[type] = true;
  notificationTime[type] = millis();

  drawNotificationIcon(type);
}


// UPDATE NOTIFICATION
void updateNotifications() {
  unsigned long now = millis();

  for (int i = 0; i < NOTIF_COUNT; i++) {
    if (notificationVisible[i] &&
        now - notificationTime[i] >= NOTIF_DURATION) {

      int x = getIconX((NotificationType)i);

      // Apaga apenas o ícone expirado
      tft.fillRect(x, NOTIF_Y, ICON_SIZE, NOTIF_H, ST77XX_BLUE);

      notificationVisible[i] = false;
    }
  }
}


// DRAW LABELS
void drawLayout() {
  tft.fillScreen(ST77XX_BLACK);
  drawHeader();

  tft.setTextColor(ST77XX_YELLOW);
  tft.setTextSize(1);

  tft.setCursor(5, 45);
  tft.print("Azim:");

  tft.setCursor(5, 55);
  tft.print("Elev:");

  tft.setCursor(5, 65);
  tft.print("Lat:");

  tft.setCursor(5, 75);
  tft.print("Long:");

  tft.setCursor(5, 85);
  tft.print("Ten:");

  tft.setCursor(5, 95);
  tft.print("Corr:");

  tft.setCursor(5, 105);
  tft.print("Pot:");

  tft.setCursor(5, 115);
  tft.print("Luz:");

  tft.setCursor(5, 125);
  tft.print("Temp:");

  tft.setCursor(5, 135);
  tft.print("Nasc:");

  tft.setCursor(5, 145);
  tft.print("Por:");
}


// UPDATE VALUES
void updateDisplay() {
  drawGPS();

  tft.fillRect(35, 45, 93, 115, ST77XX_BLACK);

  drawStatusDot(
    30,
    34,
    WiFi.status() == WL_CONNECTED);

  drawStatusDot(
    73,
    34,
    client.connected());

  tft.setTextColor(ST77XX_GREEN);
  tft.setTextSize(1);

  tft.setCursor(40, 45);
  tft.print(azimuthD, 1); 
  tft.print(" S "); 
  tft.print(sensor_azimuth, 1);

  tft.setCursor(40, 55);
  tft.print(elevation, 1); 
  tft.print(" S ");
  tft.print(sensor_elevation, 1);

  tft.setCursor(40, 65);
  tft.print(latitude, 6); 
  tft.print(" "); 
  tft.print(locationFromGPS ? "G" : "M");

  tft.setCursor(40, 75);
  tft.print(longitude, 6); 
  tft.print(" ");
  tft.print(locationFromGPS ? "G" : "M");

  tft.setCursor(40, 85);
  tft.print(voltage, 2);
  tft.print(" V");

  tft.setCursor(40, 95);
  tft.print(current, 2);
  tft.print(" A");

  tft.setCursor(40, 105);
  tft.print(voltage * current, 2);
  tft.print(" W");

  tft.setCursor(40, 115);
  tft.print(luminosity, 2);
  tft.print(" lux");

  tft.setCursor(40, 125);
  tft.print(temperature, 2);
  tft.print(" C");

  tft.setCursor(40, 135);
  tft.print(sunriseFormated);

  tft.setCursor(40, 145);
  tft.print(sunsetFormated);
}


// SENSORS DATA
void readSensors() {
  // I2C DATA
  if (bmp280.readTemperature()) {
    temperature = bmp280.readTemperature();
  } else {
    temperature = 0;
  }

  if (bh1750.readLightLevel() < 0) {
    luminosity = 0;
  } else { 
    luminosity = bh1750.readLightLevel();
  }

  checkAngles();

  // ANALOG DATA
  voltage = getPanelVoltage();
  current = getPanelCurrent();
}



// AZIMUTH SERVO MOVEMENT
void updateServoAzimuthMovement() {
  if (!orientationReady) return;

  if (millis() - lastServoMovement < 20) return;

  lastServoMovement = millis();

  // AZIMUTH
  if (fabs(azimuth - servoAzCommand) > 0.5) {
    if (servoAzCommand < azimuth)
      servoAzCommand += 1;
    else
      servoAzCommand -= 1;

    servoAzCommand = constrain(
      servoAzCommand, AZ_SERVO_MIN, AZ_SERVO_MAX
    );

    servoAzimuth.write(round(servoAzCommand));
  }
}


// ELEVATION SERVO MOVEMENT
void updateServoElevationMovement() {
  if (!orientationReady) return;

  bool mpuValid = readMPU();

  if (!mpuValid) {
    servoElevation.write(STOP);
    return;
  }

  if (elevation < 0 || elevation >= EL_SERVO_MAX) {
    servoElevation.write(STOP);
    return;
  }

  calculateElevation();

  if (elevation <= EL_SERVO_MIN) {
    elevation = EL_SERVO_MIN;
  }

  float difference = sensor_elevation - elevation;
  float error = fabsf(difference);

  if (error <= ELTOLERANCE) {
    servoElevation.write(STOP);
    return;
  }

  int speed = map(
    constrain((int)(error * 10), 0, 300),
    0, 300,
    EL_MIN_SPEED, ELVELOCITY
  );

  if (difference > 0) {
    servoElevation.write(STOP + speed);
  } else {
    servoElevation.write(STOP - speed);
  }
}



// SUNSERVICE PROCESS
void processSunservice(String payload) {
  JsonDocument doc;
  DeserializationError error =
    deserializeJson(doc, payload);

  if (error) {
    Serial.println("Erro nos dados de Sunservice");

    return;
  }

  if (doc["sunrise"].is<const char*>() && doc["sunset"].is<const char*>()){
    sunset = doc["sunset"].as<String>();
    sunrise = doc["sunrise"].as<String>();
    sunsetFormated = getISOTime(sunset, sunsetSeconds);
    sunriseFormated = getISOTime(sunrise, sunriseSeconds);
  } else {
    Serial.println("Erro: sunrise ou sunset ausente/inválido");
  }
}


// CONTROL PROCESS
void processControl(String payload) {
  JsonDocument doc;
  DeserializationError error =
    deserializeJson(doc, payload);

  if (error) {
    Serial.println("Erro nos dados de Control");
    return;
  }

  if (!doc["azimuth"].isNull()) {
    azimuthD = doc["azimuth"].as<float>();
    azimuth = convertAzimuth(azimuthD);
  }
  if (!doc["elevation"].isNull()) {
    elevation = doc["elevation"].as<float>();
  }

  if (doc["mode"] == "manual") {
    automaticMode = false;
  } else if (doc["mode"] == "automatic") {
    automaticMode = true;
  }
}


// PING TEST
void publishMQTTPing() {
  if (pingPending) return;
  pingId++;

  String payload = String(pingId);

  pingStart = millis();

  bool sent = client.publish(
    topicPing.c_str(),
    payload.c_str()
  );

  if (sent) {
    pingPending = true;
    Serial.printf("MQTT Ping enviado: %lu\n", pingId);
  } else {
    Serial.println("Falha ao enviar MQTT Ping");
  }
}


// PUBLISH INFODATA
void publishInfo() {
  JsonDocument doc;

  doc["latitude"] = latitude;
  doc["longitude"] = longitude;

  String payload;

  serializeJson(doc, payload);

  client.publish(
    topicInfo.c_str(),
    payload.c_str()
  );

  showNotification(NOTIF_INFO);
}


// PUBLISH DASHBOARD
void publishDashboard() {
  JsonDocument doc;

  // DATA
  JsonObject data = doc["data"].to<JsonObject>();
  data["voltage"] =
      voltage;
  data["current"] =
      current;
  data["luminosity"] =
      luminosity;
  data["temperature"] = 
      temperature;

  // POSITION
  JsonObject position =
      doc["position"].to<JsonObject>();
  position["actual_azimuth"] =
      azimuthD;
  position["actual_elevation"] =
      sensor_elevation;

  String payload;

  serializeJson(doc, payload);

  client.publish(
    topicDashboard.c_str(),
    payload.c_str()
  );

  showNotification(NOTIF_DASHBOARD);
}


// MQTT CALLBACK
void callback(char* topic, byte* payload, unsigned int length) {
  String topicString = String(topic);
  String message = "";

  for (unsigned int i = 0; i < length; i++) {
    message += (char)payload[i];
  }

  // TOPICS
  if (topicString == topicPong) {
    if (pingPending && message.toInt() == pingId) {
      unsigned long rtt = millis() - pingStart;
      Serial.printf("MQTT RTT: %lu ms\n", rtt);
      pingPending = false;
    }
  } else if (topicString == topicSunservice) {
    showNotification(NOTIF_SUNSERVICE);
    processSunservice(message);
  } else if (topicString == topicControl) {
    showNotification(NOTIF_CONTROL);
    processControl(message);
  } else {
    Serial.println("Tópico inválido");
  }
}


// SETUP
void setup() {
  // COMPONENTS SETUP
  Serial.begin(115200);
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  Wire.begin(SDA, SCL);

  if (initBH1750()){
    Serial.println("BH1750: OK");
  } else {
    Serial.println("BH1750: FALHA");
  }

  if (initBMP280()) {
    Serial.println("BMP280: OK");
  } else {
    Serial.println("BMP280: FALHA");
  }

  if (initMPU()) {
    Serial.println("MPU6500: OK");
  } else {
    Serial.println("MPU6500: FALHA");
  }

  if (initQMC()) {
    Serial.println("QMC5883P: OK");
  } else {
    Serial.println("QMC5883P: FALHA");
  }

  GPSserial.begin(9600, SERIAL_8N1, GPS_RX, GPS_TX);
  SPI.begin(TFT_SCLK, -1, TFT_MOSI, TFT_CS);

  analogReadResolution(12);
  analogSetPinAttenuation(VOLTAGE_PIN, ADC_11db);
  analogSetPinAttenuation(CURRENT_PIN, ADC_11db);

  loadSavedLocation();
  configureTimeZone();
  calibrateCurrentSensor();

  // DISPLAY SETUP
  tft.initR(INITR_BLACKTAB);
  tft.setRotation(2);
  drawLayout();

  // SERVOMOTORS SETUP
  servoAzimuth.setPeriodHertz(50);
  servoElevation.setPeriodHertz(50);
  servoAzimuth.attach(AZIMUTH_PIN, 500, 2500);
  servoElevation.attach(ELEVATION_PIN, 500, 2500);
  servoAzimuth.write(90);
  servoElevation.write(90);
  servoAzCommand = 90;
  orientationReady = false;

  // MQTT SETUP
  client.setServer(mqtt_broker, mqtt_port);
  client.setCallback(callback);
  client.setBufferSize(1024);
  client.setKeepAlive(30);
  client.setSocketTimeout(3);
  check_MQTT();
}


// LOOP
void loop() {
  checkOrientationCalibration();

  if (!orientationReady) {
    updateCalibrationDisplay();
  } else {
    client.loop();
    updateServoAzimuthMovement();
    updateServoElevationMovement();

    // Update TFT LCD display whithin 1 sec
    if (millis() - lastUpdate >= updateInterval) {
      lastUpdate = millis();

      check_WiFi();
      check_MQTT();
      readSensors();
      updateSystemTime();
      updateGPSLocation();
      updateClockVariables();
      updateDisplay();
      updateNotifications();
    }

    if (client.connected()) {
      if (pingId < 10) {
        if (!pingPending &&
            millis() - lastPing >= PING_INTERVAL) {

          lastPing = millis();
          publishMQTTPing();
        }

        if (pingPending &&
            millis() - pingStart >= PING_TIMEOUT) {

          Serial.println("MQTT Ping timeout!");

          pingPending = false;
        }
      } 

      // Publish info or dashboard data whithin 10 sec
      if (millis() - lastPublish >= publishInterval)
      {
        lastPublish = millis();

        checkNewDay();

        if (isDaytime()) {
          publishDashboard();
        }
      }
    }
  }
}