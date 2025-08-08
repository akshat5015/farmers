import os
import base64
from io import BytesIO
from PIL import Image
from dotenv import load_dotenv
import google.generativeai as genai
from translate import Translator
import textwrap

# Load environment variables
load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise ValueError("GEMINI_API_KEY not found in .env file")

# Configure Gemini
genai.configure(api_key=api_key)

class AgricultureAssistant:
    def __init__(self):
        self.model = genai.GenerativeModel('gemini-1.5-flash')
        self.chat_session = None
        self.language = "en"

    def set_language(self, lang):
        self.language = 'hi' if 'hi' in lang else 'en'
        print(f"Assistant language set to: {self.language}")

    def translate_text(self, text, target_lang, source_lang='en'):
        if source_lang == target_lang:
            return text
        try:
            translator = Translator(from_lang=source_lang, to_lang=target_lang)
            if len(text) > 450:
                translated_text = ""
                chunks = textwrap.wrap(text, 450, break_long_words=False, replace_whitespace=False)
                for chunk in chunks:
                    translated_chunk = translator.translate(chunk)
                    translated_text += translated_chunk
                return translated_text
            else:
                return translator.translate(text)
        except Exception as e:
            print(f"Translation error: {e}")
            return text

    def translate_to_english(self, text):
        return self.translate_text(text, 'en', source_lang=self.language)

    def process_image(self, image_data_base64):
        try:
            img_bytes = base64.b64decode(image_data_base64)
            img = Image.open(BytesIO(img_bytes))
            
            prompt = (
                "You are an expert agricultural assistant. Your entire conversation with the user will be based on the "
                "image they have provided. Always refer back to this image when answering questions. "
                "For your very first response, provide a concise and complete summary of the image in approximately 50 words. This summary must be a coherent, well-formed paragraph, not a truncated sentence. "
                "Focus on crops, soil, pests, or farming practices and identify potential issues. After this introduction, "
                "you will answer the user's follow-up questions in full detail, providing comprehensive and helpful advice."
            )
            
            self.chat_session = self.model.start_chat(history=[])
            response = self.chat_session.send_message([prompt, img])
            model_description = response.text

            if self.language == 'hi':
                return self.translate_text(model_description, 'hi')
            else:
                return model_description
        except Exception as e:
            print("Image processing error:", str(e))
            return self.translate_text("Error processing image", self.language)

    def generate_response(self, user_input):
        if not self.chat_session:
            return self.translate_text("The session has not been started. Please upload an image first.", self.language)

        if "stop" in user_input.lower() or "रुक जाओ" in user_input.lower():
            return self.translate_text("Session ended. Thank you for using the Agriculture Assistant.", self.language)
        
        user_input_en = self.translate_to_english(user_input)
        response = self.chat_session.send_message(user_input_en)
        return self.translate_text(response.text, self.language)