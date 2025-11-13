from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import os
from groq import Groq
import json
import uuid

GROQ_API_KEY = "enter api key here"  


app = Flask(__name__)

CORS(app,
     resources={r"/*": {"origins": "*"}},
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization"],
     supports_credentials=True)


app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///movies.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'dev-secret-key-change-in-production'

db = SQLAlchemy(app)

if GROQ_API_KEY and GROQ_API_KEY != "your_groq_api_key_here":
    client = Groq(api_key=GROQ_API_KEY)
    print("✅ Groq AI client initialized with llama-3.3-70b-versatile")
else:
    print("⚠️  WARNING: GROQ_API_KEY not set. Please update the GROQ_API_KEY variable in the script.")
    client = None

# ==================== DATABASE MODELS ====================

class User(db.Model):
    """User model - stores session information"""
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(100), unique=True, nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_active = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    recommendations = db.relationship('Recommendation', backref='user', lazy=True, cascade='all, delete-orphan')

class Recommendation(db.Model):
    """Recommendation model - stores user queries and recommendations"""
    __tablename__ = 'recommendations'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    query = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    movies = db.relationship('Movie', backref='recommendation', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'query': self.query,
            'created_at': self.created_at.isoformat(),
            'movies': [movie.to_dict() for movie in self.movies]
        }

class Movie(db.Model):
    """Movie model - stores individual movie recommendations"""
    __tablename__ = 'movies'
    id = db.Column(db.Integer, primary_key=True)
    recommendation_id = db.Column(db.Integer, db.ForeignKey('recommendations.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    year = db.Column(db.Integer, nullable=False)
    genre = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    rating = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'year': self.year,
            'genre': self.genre,
            'description': self.description,
            'rating': self.rating
        }

# ==================== HELPER FUNCTIONS ====================

def get_or_create_user(session_id):
    """
    Get existing user or create new one
    WORKFLOW STEP 3: Backend validates and manages user sessions
    """
    try:
        user = User.query.filter_by(session_id=session_id).first()
        if not user:
            user = User(session_id=session_id)
            db.session.add(user)
            db.session.commit()
            print(f"✅ Created new user: {session_id}")
        else:
            user.last_active = datetime.utcnow()
            db.session.commit()
            print(f"✅ User found: {session_id}")
        return user
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error in get_or_create_user: {str(e)}")
        return None

def generate_recommendations_with_groq(query):
    """
    Generate movie recommendations using Groq AI (Llama 3.3 70B)
    WORKFLOW STEP 4: AI Model analyzes and generates recommendations
    """
    if not client:
        return {
            "success": False, 
            "error": "AI service not configured. Please set GROQ_API_KEY in the script."
        }
    
    try:
        print(f"🤖 Calling Groq AI (Llama 3.3 70B) with query: {query}")
        
        # Create the prompt for Groq
        prompt = f"""You are a movie expert AI assistant. Based on the user's preference: "{query}", recommend exactly 5 movies.

Return ONLY a valid JSON array with this exact format (no markdown, no explanation, no extra text):
[
  {{"title": "Movie Name", "year": 2024, "genre": "Action, Drama", "description": "Brief 2-3 sentence description of the movie plot and why it's recommended.", "rating": 8.5}}
]

IMPORTANT REQUIREMENTS:
- Return exactly 5 movies
- Use real movies with accurate release years
- Genre should be comma-separated string (e.g., "Action, Thriller")
- Rating must be between 6.0 and 10.0 as a float
- Description should be 2-3 sentences explaining the plot and why it matches the user's preference
- Return ONLY the JSON array with no additional text, no markdown code blocks, no explanations
- Ensure the JSON is properly formatted and valid"""

        # Call Groq API
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful movie recommendation assistant. You ONLY respond with valid JSON arrays containing movie data. Never include markdown formatting or explanations."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.7,
            max_tokens=2048,
            top_p=0.9,
        )
        
        content = chat_completion.choices[0].message.content.strip()
        print(f"📥 Groq AI Response: {content[:200]}...")
        
        # Clean and parse JSON
        if content.startswith('```'):
            content = content.replace('```json', '').replace('```', '').strip()
        
        # Remove any leading/trailing text before/after JSON
        start_idx = content.find('[')
        end_idx = content.rfind(']') + 1
        if start_idx != -1 and end_idx > start_idx:
            content = content[start_idx:end_idx]
        
        movies = json.loads(content)
        
        if not isinstance(movies, list):
            # If wrapped in object, try to extract array
            if isinstance(movies, dict):
                for key in ['movies', 'recommendations', 'results']:
                    if key in movies and isinstance(movies[key], list):
                        movies = movies[key]
                        break
        
        if not isinstance(movies, list) or len(movies) == 0:
            raise ValueError("Invalid response format - expected array of movies")
        
        # Validate and ensure proper data types
        required_fields = ['title', 'year', 'genre', 'description', 'rating']
        for movie in movies:
            for field in required_fields:
                if field not in movie:
                    raise ValueError(f"Missing required field: {field}")
            
            # Ensure proper data types
            movie['year'] = int(movie['year'])
            movie['rating'] = float(movie['rating'])
            movie['title'] = str(movie['title'])
            movie['genre'] = str(movie['genre'])
            movie['description'] = str(movie['description'])
        
        print(f"✅ Generated {len(movies)} movie recommendations")
        return {"success": True, "movies": movies}
    
    except json.JSONDecodeError as e:
        print(f"❌ JSON parsing error: {str(e)}")
        print(f"Response content: {content}")
        return {"success": False, "error": "Failed to parse AI response. Please try again."}
    except Exception as e:
        print(f"❌ Error generating recommendations: {str(e)}")
        return {"success": False, "error": str(e)}

def save_recommendation_to_db(user, query, movies):
    """
    Save recommendation and movies to database
    WORKFLOW STEP 5: Backend stores recommendations in SQL database
    """
    try:
        # Create recommendation record
        recommendation = Recommendation(user_id=user.id, query=query)
        db.session.add(recommendation)
        db.session.flush()  # Get recommendation.id without committing
        
        # Create movie records
        for movie_data in movies:
            movie = Movie(
                recommendation_id=recommendation.id,
                title=movie_data['title'],
                year=movie_data['year'],
                genre=movie_data['genre'],
                description=movie_data['description'],
                rating=movie_data['rating']
            )
            db.session.add(movie)
        
        db.session.commit()
        print(f"✅ Saved recommendation {recommendation.id} with {len(movies)} movies to database")
        return recommendation
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error saving to database: {str(e)}")
        return None

# ==================== API ENDPOINTS ====================

@app.route('/', methods=['GET'])
def home():
    """Root endpoint - API information (JSON only)"""
    return jsonify({
        "message": "🎬 CineAI Backend API",
        "status": "running",
        "version": "1.0.0",
        "ai_provider": "Groq (Llama 3.3 70B Versatile)",
        "database": "SQLite",
        "frontend_url": "http://localhost:3000",
        "endpoints": {
            "health": {
                "method": "GET",
                "path": "/api/health",
                "description": "Check server health and configuration status"
            },
            "recommend": {
                "method": "POST",
                "path": "/api/recommend",
                "description": "Get AI-powered movie recommendations",
                "body": {
                    "query": "string (required)",
                    "session_id": "string (optional)"
                }
            },
            "history": {
                "method": "GET",
                "path": "/api/history/<session_id>",
                "description": "Retrieve user's recommendation history",
                "query_params": {
                    "limit": "integer (optional, default: 10)"
                }
            },
            "statistics": {
                "method": "GET",
                "path": "/api/statistics",
                "description": "Get application usage statistics and analytics"
            },
            "clear_history": {
                "method": "DELETE",
                "path": "/api/clear-history/<session_id>",
                "description": "Clear all recommendations for a specific user session"
            }
        }
    }), 200

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint - verify system status"""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "database": "connected",
        "ai_service": "configured" if client else "not configured",
        "ai_provider": "Groq (Llama 3.3 70B Versatile)",
        "environment": "development" if app.debug else "production"
    }), 200

@app.route('/api/recommend', methods=['POST', 'OPTIONS'])
def get_recommendations():
    """
    Main recommendation endpoint - generates AI-powered movie recommendations
    WORKFLOW: Frontend → Backend → AI → Database → Frontend
    """
    
    # Handle CORS preflight
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        print("\n" + "="*60)
        print("📨 STEP 2: Received recommendation request from frontend")
        
        data = request.get_json()
        print(f"📦 Request data: {data}")
        
        if not data:
            return jsonify({"success": False, "error": "No data provided"}), 400
        
        # Extract and validate query
        query = data.get('query', '').strip()
        if not query:
            return jsonify({"success": False, "error": "Query is required"}), 400
        
        session_id = data.get('session_id', str(uuid.uuid4()))
        print(f"🔑 Session ID: {session_id}")
        
        # STEP 3: Get or create user in database
        print("📊 STEP 3: Managing user session in database")
        user = get_or_create_user(session_id)
        if not user:
            return jsonify({"success": False, "error": "Failed to create user session"}), 500
        
        # STEP 4: Generate recommendations using Groq AI
        print("🤖 STEP 4: Calling Groq AI (Llama 3.3 70B) to generate recommendations")
        result = generate_recommendations_with_groq(query)
        
        if not result['success']:
            return jsonify({"success": False, "error": result.get('error')}), 500
        
        movies = result['movies']
        
        # STEP 5: Save to database
        print("💾 STEP 5: Saving recommendations to database")
        recommendation = save_recommendation_to_db(user, query, movies)
        
        # STEP 6: Send response to frontend
        response_data = {
            "success": True,
            "movies": movies,
            "session_id": session_id,
            "recommendation_id": recommendation.id if recommendation else None,
            "timestamp": datetime.utcnow().isoformat(),
            "query": query
        }
        
        print(f"✅ STEP 6: Sending {len(movies)} movies to frontend")
        print("="*60 + "\n")
        
        return jsonify(response_data), 200
    
    except Exception as e:
        print(f"❌ Error in get_recommendations: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "error": "Internal server error"}), 500

@app.route('/api/history/<session_id>', methods=['GET'])
def get_user_history(session_id):
    """Get user recommendation history from database"""
    try:
        limit = request.args.get('limit', 10, type=int)
        user = User.query.filter_by(session_id=session_id).first()
        
        if not user:
            return jsonify({"success": True, "recommendations": []}), 200
        
        recommendations = Recommendation.query.filter_by(user_id=user.id)\
            .order_by(Recommendation.created_at.desc())\
            .limit(limit)\
            .all()
        
        print(f"📜 Retrieved {len(recommendations)} history items for session {session_id}")
        
        return jsonify({
            "success": True,
            "recommendations": [rec.to_dict() for rec in recommendations]
        }), 200
    
    except Exception as e:
        print(f"❌ Error in get_user_history: {str(e)}")
        return jsonify({"success": False, "error": "Failed to fetch history"}), 500

@app.route('/api/statistics', methods=['GET'])
def get_statistics():
    """Get application statistics from database"""
    try:
        total_users = User.query.count()
        total_recommendations = Recommendation.query.count()
        total_movies = Movie.query.count()
        
        # Get recent activity
        recent_recommendations = Recommendation.query\
            .order_by(Recommendation.created_at.desc())\
            .limit(5)\
            .all()
        
        return jsonify({
            "success": True,
            "statistics": {
                "total_users": total_users,
                "total_recommendations": total_recommendations,
                "total_movies": total_movies,
                "average_movies_per_recommendation": round(total_movies / total_recommendations, 2) if total_recommendations > 0 else 0
            },
            "recent_activity": [
                {
                    "query": rec.query,
                    "movie_count": len(rec.movies),
                    "timestamp": rec.created_at.isoformat()
                } for rec in recent_recommendations
            ]
        }), 200
    
    except Exception as e:
        print(f"❌ Error in get_statistics: {str(e)}")
        return jsonify({"success": False, "error": "Failed to fetch statistics"}), 500

@app.route('/api/clear-history/<session_id>', methods=['DELETE', 'OPTIONS'])
def clear_user_history(session_id):
    """Clear user recommendation history from database"""
    
    # Handle CORS preflight
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        user = User.query.filter_by(session_id=session_id).first()
        
        if not user:
            return jsonify({"success": False, "error": "User not found"}), 404
        
        # Delete all recommendations (movies will be cascade deleted)
        deleted_count = Recommendation.query.filter_by(user_id=user.id).delete()
        db.session.commit()
        
        print(f"🗑️  Cleared {deleted_count} recommendations for session {session_id}")
        
        return jsonify({
            "success": True,
            "message": f"History cleared successfully ({deleted_count} items removed)"
        }), 200
    
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error in clear_user_history: {str(e)}")
        return jsonify({"success": False, "error": "Failed to clear history"}), 500

# ==================== ERROR HANDLERS ====================

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({
        "error": "Endpoint not found", 
        "path": request.path,
        "message": "The requested endpoint does not exist"
    }), 404

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    db.session.rollback()
    return jsonify({
        "error": "Internal server error",
        "message": "An unexpected error occurred"
    }), 500

# ==================== DATABASE INITIALIZATION ====================

def init_db():
    """Initialize database tables"""
    with app.app_context():
        db.create_all()
        print("✅ Database initialized successfully")
        
        # Print table info
        inspector = db.inspect(db.engine)
        tables = inspector.get_table_names()
        print(f"📊 Database tables: {', '.join(tables)}")

# ==================== MAIN ====================

if __name__ == '__main__':
    print("\n" + "="*60)
    print("🎬 CineAI Backend API Server")
    print("="*60)
    
    # Initialize database
    init_db()
    
    # Display configuration
    print(f"\n🔧 Configuration:")
    print(f"   🔑 Groq API Key: {'✅ Configured' if client else '❌ Not Set (Update GROQ_API_KEY variable)'}")
    print(f"   🤖 AI Model: Llama 3.3 70B Versatile (via Groq)")
    print(f"   🗄️  Database: SQLite (movies.db)")
    print(f"   🔒 Secret Key: Using default")
    
    print(f"\n🌐 Server Configuration:")
    print(f"   📍 Host: 0.0.0.0")
    print(f"   🔌 Port: 5000")
    print(f"   🌍 Backend API: http://localhost:5000")
    print(f"   🐛 Debug Mode: {app.debug}")
    
    print(f"\n📡 API Endpoints (JSON only):")
    print(f"   - GET    /                              → API Info")
    print(f"   - GET    /api/health                    → Health Check")
    print(f"   - POST   /api/recommend                 → Get Recommendations")
    print(f"   - GET    /api/history/<session_id>      → Get History")
    print(f"   - GET    /api/statistics                → Get Statistics")
    print(f"   - DELETE /api/clear-history/<session_id> → Clear History")
    
    print("\n" + "="*60)
    print("🚀 Starting API Server...")
    print("⚛️  React Frontend: http://localhost:3000")
    print("📝 Make sure React is running separately!")
    print("="*60 + "\n")
    
    # Run the Flask app
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True,
        use_reloader=False  # Disable reloader to prevent double browser opening
    )