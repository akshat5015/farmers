# Farmers AI Assistant 🌾🤖

This project is an AI-powered conversational assistant designed to help farmers in their daily agricultural activities.
It accepts **crop images** and **voice/text input** in **Hindi or English**, analyzes plant health using a vision model,
and provides **farming recommendations**, **disease/pest diagnosis**, and **treatment suggestions**.
The system also supports **voice output**, allowing farmers to interact hands-free.

---

## ✨ Features

| Feature | Description |
|--------|-------------|
| 🖼️ Image-Based Crop Analysis | Farmers upload a crop image to detect disease or health issues |
| 🎤 Voice Input | Supports **Hindi** and **English** speech-to-text |
| 🗣️ Voice Output | Generates verbal answers using TTS for accessibility |
| 🌐 Multilingual | Automatically translates Hindi ↔ English when required |
| 🤝 Interactive Chat | Allows continuous Q&A and follow-up questions |
| 🔍 Agricultural Knowledge | Provides solutions related to soil, fertilizers, pests, weather and crop care |

---

## 🧠 Tech Stack

| Component | Tool |
|----------|------|
| Image Understanding | Gemini Vision Model |
| NLP / Chat Responses | Generative AI (Gemini / GPT-based logic) |
| Speech-to-Text | Whisper / Vosk (choose depending on environment) |
| Text-to-Speech | gTTS / pyttsx3 |
| Backend Framework | Flask |
| Frontend | HTML + CSS + JS (from `templates` + `static`) |

---

## 📂 Project Structure

farmers/
│── app.py # Main Flask application
│── helper.py # Utility functions (AI model calls, translation, speech handling)
│── requirements.txt # Dependencies
│── .env # API keys (DO NOT SHARE)
│── static/ # CSS, JS, images
│── templates/ # HTML files



---

## 🎤 Usage

- Upload an image of the crop
- Ask your question in **Hindi or English**
- Receive text + **voice answer**
- Continue conversation as needed

---

## 📌 Future Enhancements

- Weather-based crop planning
- Soil nutrient deficiency detection
- Marketplace pricing recommendations

---

## 🤝 Contributing

Pull requests are welcome.  
For major changes, please open an issue first to discuss your ideas.

---

## 📄 License

This project is open-source for learning and research purposes.
