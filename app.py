from flask import Flask, render_template, request, jsonify
from helper import AgricultureAssistant
import base64

app = Flask(__name__)

# Disclaimer: A single global assistant instance is used for simplicity.
# This is not suitable for production with multiple simultaneous users.
assistant = None

@app.route('/')
def index():
    """Serves the welcome page."""
    return render_template('index.html')

@app.route('/chat')
def chat():
    """Serves the main chat application page."""
    return render_template('chat.html')

@app.route('/process-image', methods=['POST'])
def process_image():
    """Processes the uploaded image and starts a new session."""
    global assistant
    
    data = request.json
    image_data_url = data.get('image')
    lang = data.get('language')

    # Create a new assistant for each new image upload
    assistant = AgricultureAssistant()
    assistant.set_language(lang)
    
    # The frontend sends a data URL (e.g., "data:image/jpeg;base64,L..."), we need to strip the header
    try:
        header, encoded = image_data_url.split(",", 1)
    except ValueError:
        return jsonify({'error': 'Invalid image data URL'}), 400
    
    initial_response = assistant.process_image(encoded)
    
    return jsonify({'response': initial_response})

@app.route('/ask', methods=['POST'])
def ask():
    """Handles follow-up questions from the user."""
    global assistant
    
    if not assistant:
        return jsonify({'error': 'Session not started'}), 400
        
    data = request.json
    user_question = data.get('question')
    
    if not user_question:
        return jsonify({'error': 'No question provided'}), 400
        
    response = assistant.generate_response(user_question)
    
    return jsonify({'response': response})

if __name__ == '__main__':
    app.run(debug=True, port=5001)