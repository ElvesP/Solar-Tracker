#include <WiFi.h>
#include <PubSubClient.h>
#include <Wire.h>
#include <SPI.h>
#include <Adafruit_GFX.h>
#include <Adafruit_ST7735.h>
#include <Servo.h>
#include <ArduinoJson.h>

// =====================
// WIFI CONFIG
// =====================
const char* ssid = "SEU_WIFI";
const char* password = "SUA_SENHA";

// =====================
// MQTT CONFIG
// =====================
const char* mqtt_server = "192.168.1.10"; // IP do broker Mosquitto
const char* topic_pub = "solar/data";
const char* topic_sub = "solar/control";

// ============================
// TFT PINS
// ============================
#define TFT_CS     5
#define TFT_RST    4
#define TFT_DC     2

Adafruit_ST7735 tft = Adafruit_ST7735(TFT_CS, TFT_DC, TFT_RST);

// =====================
// SERVOS
// =====================
Servo servoAzimute;
Servo servoElevacao;

#define PIN_AZIMUTE  13
#define PIN_ELEVACAO 12

int azimute = 90;
int elevacao = 90;

// =====================
// MQTT CLIENT
// =====================
WiFiClient espClient;
PubSubClient client(espClient);

// =====================
// MODE CONTROL
// =====================
String mode = "auto"; // auto ou manual

// =====================
// SIMULATED SENSORS (substituir por reais depois)
// =====================
float tensao = 18.2;
float corrente = 1.5;
float potencia = 27.3;
float temperatura = 30.1;
int luminosidade = 800;

// =====================
// WIFI CONNECT
// =====================
void setup_wifi() {
  delay(10);
  Serial.println("A conectar ao WiFi...");

  tft.fillScreen(ST77XX_BLACK);

  tft.setCursor(10, 30);
  tft.setTextColor(ST77XX_WHITE);
  tft.setTextSize(1);
  tft.println("Conectando WiFi...");

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi conectado!");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());

  tft.println("WiFi OK");
}

// ============================
// DRAW HEADER
// ============================
void drawHeader() {

  tft.fillRect(0, 0, 128, 20, ST77XX_BLUE);

  tft.setCursor(5, 5);
  tft.setTextColor(ST77XX_WHITE);
  tft.setTextSize(1);
  tft.print("SOLAR TRACKER");
}

// ============================
// DRAW LABELS
// ============================
void drawLayout() {

  tft.fillScreen(ST77XX_BLACK);

  drawHeader();

  tft.setTextColor(ST77XX_YELLOW);
  tft.setTextSize(1);

  tft.setCursor(5, 25);
  tft.print("Modo:");

  tft.setCursor(5, 40);
  tft.print("Tensao:");

  tft.setCursor(5, 55);
  tft.print("Corrente:");

  tft.setCursor(5, 70);
  tft.print("Potencia:");

  tft.setCursor(5, 85);
  tft.print("Temp:");

  tft.setCursor(5, 100);
  tft.print("Luz:");

  tft.setCursor(5, 115);
  tft.print("Azimute:");

  tft.setCursor(5, 130);
  tft.print("Elevacao:");
}

// ============================
// UPDATE VALUES
// ============================
void updateDisplay() {

  // Limpa área dos valores
  tft.fillRect(65, 25, 60, 110, ST77XX_BLACK);

  tft.setTextColor(ST77XX_GREEN);
  tft.setTextSize(1);

  tft.setCursor(70, 25);
  tft.print(modo);

  tft.setCursor(70, 40);
  tft.print(tensao);
  tft.print("V");

  tft.setCursor(70, 55);
  tft.print(corrente);
  tft.print("A");

  tft.setCursor(70, 70);
  tft.print(potencia);
  tft.print("W");

  tft.setCursor(70, 85);
  tft.print(temperatura);
  tft.print("C");

  tft.setCursor(70, 100);
  tft.print(luminosidade);

  tft.setCursor(70, 115);
  tft.print(azimute);

  tft.setCursor(70, 130);
  tft.print(elevacao);

  // STATUS MQTT
  if (client.connected()) {
    tft.fillCircle(118, 10, 4, ST77XX_GREEN);
  } else {
    tft.fillCircle(118, 10, 4, ST77XX_RED);
  }
}

// =====================
// MQTT CALLBACK
// =====================
void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Mensagem recebida [");
  Serial.print(topic);
  Serial.print("] ");

  String message;

  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }

  Serial.println(message);

  // Parse JSON
  StaticJsonDocument<200> doc;
  DeserializationError error = deserializeJson(doc, message);

  if (error) {
    Serial.println("Erro no JSON");
    return;
  }

  // =====================
  // CONTROL COMMANDS
  // =====================
  if (doc.containsKey("mode")) {
    mode = doc["mode"].as<String>();
  }

  if (doc.containsKey("azimute")) {
    azimute = doc["azimute"];
    servoAzimute.write(azimute);
  }

  if (doc.containsKey("elevacao")) {
    elevacao = doc["elevacao"];
    servoElevacao.write(elevacao);
  }

  if (doc.containsKey("estado")) {
    bool estado = doc["estado"];
    if (!estado) {
      servoAzimute.write(90);
      servoElevacao.write(90);
    }
  }

  updateDisplay();
}

// =====================
// MQTT RECONNECT
// =====================
void reconnect() {
  while (!client.connected()) {
    Serial.print("A conectar MQTT...");

    if (client.connect("ESP32_SolarTracker")) {
      Serial.println("conectado!");
      client.subscribe(topic_sub);
    } else {
      Serial.print("falhou, rc=");
      Serial.print(client.state());
      delay(2000);
    }
  }
}

// =====================
// SETUP
// =====================
void setup() {
  Serial.begin(115200);

  tft.initR(INITR_BLACKTAB);

  tft.setRotation(1);

  drawLayout();

  servoAzimute.attach(PIN_AZIMUTE);
  servoElevacao.attach(PIN_ELEVACAO);

  servoAzimute.write(90);
  servoElevacao.write(90);

  setup_wifi();

  client.setServer(mqtt_server, 1883);
  client.setCallback(callback);
}

// =====================
// SIMULAR SENSORES
// =====================
void readSensors() {
  // Aqui substituis pelos teus sensores reais
  temperatura = 25 + random(0, 100) / 10.0;
  luminosidade = random(600, 1000);
  tensao = 18 + random(0, 50) / 10.0;
  corrente = 1 + random(0, 20) / 10.0;
  potencia = tensao * corrente;
}

// =====================
// AUTO TRACKING SIMPLES
// =====================
voi d autoTracking() {
  int luz = luminosidade;

  if (luz < 700) {
    azimute += 1;
    elevacao += 1;
  } else if (luz > 900) {
    azimute -= 1;
    elevacao -= 1;
  }

  azimute = constrain(azimute, 0, 180);
  elevacao = constrain(elevacao, 0, 180);

  servoAzimute.write(azimute);
  servoElevacao.write(elevacao);
}

// =====================
// PUBLISH DATA
// =====================
void publishData() {
  StaticJsonDocument<300> doc;

  doc["tensao"] = tensao;
  doc["corrente"] = corrente;
  doc["potencia"] = potencia;
  doc["temperatura"] = temperatura;
  doc["luminosidade"] = luminosidade;
  doc["azimute"] = azimute;
  doc["elevacao"] = elevacao;
  doc["mode"] = mode;

  char buffer[256];
  serializeJson(doc, buffer);

  client.publish(topic_pub, buffer);
}

// =====================
// LOOP
// =====================
void loop() {
  if (!client.connected()) {
    reconnect();
  }

  client.loop();

  readSensors();

  if (mode == "auto") {
    autoTracking();
  }

  publishData();

  updateDisplay();

  delay(3000);
}