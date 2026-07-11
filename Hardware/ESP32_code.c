#include <SPI.h>
#include <MFRC522.h>

#define SS_PIN 5
#define RST_PIN 4
#define VALID_LED_PIN 22   // D22 - LED for valid card
#define INVALID_LED_PIN 2  // D2 - Built-in LED for invalid card

MFRC522 rfid(SS_PIN, RST_PIN);
MFRC522::MIFARE_Key key;

String lastCardUID = "";     // Store last read card UID
String lastData = "";        // Store last read data
unsigned long lastReadTime = 0;
const unsigned long readCooldown = 2000;  // 2 second cooldown for same card
bool cardPresent = false;    // Track if card is still present

// LED control variables
unsigned long ledTurnOffTime = 0;
bool ledActive = false;

void setup() {
  Serial.begin(9600);
  
  // Initialize LED pins
  pinMode(VALID_LED_PIN, OUTPUT);
  pinMode(INVALID_LED_PIN, OUTPUT);
  digitalWrite(VALID_LED_PIN, LOW);
  digitalWrite(INVALID_LED_PIN, LOW);
  
  // Initialize SPI for ESP32 - SCK=18, MISO=19, MOSI=23, SS=5
  SPI.begin(18, 19, 23, 5);
  rfid.PCD_Init();

  for (byte i = 0; i < 6; i++) {
    key.keyByte[i] = 0xFF;
  }

  Serial.println("READY");
  Serial.println("RFID Reader Ready");
}

void loop() {
  // Check LED timeout
  if (ledActive && millis() >= ledTurnOffTime) {
    digitalWrite(VALID_LED_PIN, LOW);
    digitalWrite(INVALID_LED_PIN, LOW);
    ledActive = false;
  }
  
  // Check for commands from Python
  if (Serial.available()) {
    String command = Serial.readStringUntil('\n');
    command.trim();
    
    // Handle LED commands
    if (command == "VALID") {
      turnOnValidLED();
      Serial.println("LED_VALID_OK");
    }
    else if (command == "INVALID") {
      turnOnInvalidLED();
      Serial.println("LED_INVALID_OK");
    }
    // Handle write command (phone number)
    else if (command.length() > 0 && command.length() <= 15) {
      writeToCard(command);
      // Reset lastData to force reading new data after write
      lastData = "";
    }
  }

  // Read card with duplicate prevention
  readCardOnce();
}

void turnOnValidLED() {
  digitalWrite(VALID_LED_PIN, HIGH);
  digitalWrite(INVALID_LED_PIN, LOW);
  ledTurnOffTime = millis() + 3000;  // 3 seconds
  ledActive = true;
}

void turnOnInvalidLED() {
  digitalWrite(VALID_LED_PIN, LOW);
  digitalWrite(INVALID_LED_PIN, HIGH);
  ledTurnOffTime = millis() + 3000;  // 3 seconds
  ledActive = true;
}

void writeToCard(String data) {
  if (!rfid.PICC_IsNewCardPresent()) {
    Serial.println("NO_CARD");
    return;
  }

  if (!rfid.PICC_ReadCardSerial()) {
    Serial.println("READ_FAIL");
    return;
  }

  byte block = 4;
  byte buffer[16];
  memset(buffer, ' ', 16);
  data = data.substring(0, 15);
  data.getBytes(buffer, 16);

  MFRC522::StatusCode status = rfid.PCD_Authenticate(
    MFRC522::PICC_CMD_MF_AUTH_KEY_A,
    block, &key, &(rfid.uid)
  );

  if (status != MFRC522::STATUS_OK) {
    Serial.println("AUTH_FAIL");
    rfid.PICC_HaltA();
    rfid.PCD_StopCrypto1();
    return;
  }

  status = rfid.MIFARE_Write(block, buffer, 16);

  if (status == MFRC522::STATUS_OK) {
    Serial.println("WRITE_OK");
    // Reset lastData to force reading the new data
    lastData = "";
  } else {
    Serial.println("WRITE_FAIL");
  }

  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
}

void readCardOnce() {
  // Check if enough time has passed since last read
  if (millis() - lastReadTime < 100) {
    return; // Small delay to prevent overwhelming the reader
  }
  
  // Check for new card present
  if (!rfid.PICC_IsNewCardPresent()) {
    cardPresent = false;
    return;
  }

  // Try to read the card serial
  if (!rfid.PICC_ReadCardSerial()) {
    return;
  }

  // Get current card UID as string
  String currentUID = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) {
      currentUID += "0";
    }
    currentUID += String(rfid.uid.uidByte[i], HEX);
  }

  // Check if this is the same card as last time AND within cooldown period
  if (currentUID == lastCardUID && (millis() - lastReadTime) < readCooldown) {
    // Same card, ignore it
    rfid.PICC_HaltA();
    rfid.PCD_StopCrypto1();
    return;
  }

  // New card or cooldown passed - process it
  lastCardUID = currentUID;
  lastReadTime = millis();
  cardPresent = true;

  byte block = 4;
  byte buffer[18];
  byte size = sizeof(buffer);

  MFRC522::StatusCode status = rfid.PCD_Authenticate(
    MFRC522::PICC_CMD_MF_AUTH_KEY_A,
    block, &key, &(rfid.uid)
  );

  if (status != MFRC522::STATUS_OK) {
    Serial.println("READ_AUTH_FAIL");
    rfid.PICC_HaltA();
    rfid.PCD_StopCrypto1();
    return;
  }

  status = rfid.MIFARE_Read(block, buffer, &size);

  if (status == MFRC522::STATUS_OK) {
    String currentData = "";

    for (byte i = 0; i < 16; i++) {
      if (buffer[i] != 0 && buffer[i] != 255) {
        currentData += (char)buffer[i];
      }
    }

    currentData.trim();

    // Send data with proper format
    if (currentData.length() > 0) {
      Serial.println("DATA:" + currentData);
      lastData = currentData;
    } else {
      // Card has no data written yet
      Serial.println("DATA:NO_DATA");
    }
  } else {
    Serial.println("READ_FAIL");
  }

  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
}
