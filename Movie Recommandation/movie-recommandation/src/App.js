import React, { useState, useEffect, useRef } from 'react';
import { Film, Sparkles, Search, Star, Calendar, Clock, TrendingUp, Play, BookmarkPlus, Share2, BarChart3, ChevronDown, ChevronRight, History } from 'lucide-react';

// API Configuration
const API_BASE_URL = "http://localhost:5000";

function App() {
  const [preference, setPreference] = useState('');
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searched, setSearched] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedYears, setSelectedYears] = useState([]);
  const [showGenreDropdown, setShowGenreDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const genreDropdownRef = useRef(null);
  const yearDropdownRef = useRef(null);

  // Initialize session ID
  useEffect(() => {
    let storedSessionId = localStorage.getItem('cineai_session_id');
    if (!storedSessionId) {
      storedSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('cineai_session_id', storedSessionId);
    }
    setSessionId(storedSessionId);
    console.log('Session ID:', storedSessionId);
    
    if (storedSessionId) {
      loadHistory(storedSessionId);
    }
  }, []);

  const loadHistory = async (sid) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/history/${sid}?limit=5`);
      const data = await response.json();
      if (data.success) {
        setHistory(data.recommendations || []);
        console.log('Loaded history:', data.recommendations?.length || 0);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (genreDropdownRef.current && !genreDropdownRef.current.contains(event.target)) {
        setShowGenreDropdown(false);
      }
      if (yearDropdownRef.current && !yearDropdownRef.current.contains(event.target)) {
        setShowYearDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const categories = [
    'Action', 'Adventure', 'Animation', 'Biography', 'Comedy', 'Crime',
    'Documentary', 'Drama', 'Fantasy', 'History', 'Horror', 'Mystery',
    'Romance', 'Sci-Fi', 'Sports', 'Thriller', 'War', 'Western'
  ];

  const yearRanges = [
    '2025', '2024', '2023', '2022', '2021', '2020',
    '2019', '2018', '2017', '2016', '2015', '2014',
    '2013', '2012', '2011', '2010', '2000-2009', '1980-1999'
  ];

  const handleCategorySelect = (category) => {
    setSelectedCategories(prev => {
      const newCategories = prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category];
      updatePreference(newCategories, selectedYears);
      return newCategories;
    });
  };

  const handleYearSelect = (year) => {
    setSelectedYears(prev => {
      const newYears = prev.includes(year)
        ? prev.filter(y => y !== year)
        : [...prev, year];
      updatePreference(selectedCategories, newYears);
      return newYears;
    });
  };

  const updatePreference = (categories, years) => {
    let newPreference = '';
    if (categories.length > 0 && years.length > 0) {
      newPreference = `${categories.join(', ')} movies from ${years.join(', ')}`;
    } else if (categories.length > 0) {
      newPreference = `${categories.join(', ')} movies`;
    } else if (years.length > 0) {
      newPreference = `Movies from ${years.join(', ')}`;
    }
    setPreference(newPreference);
  };
  useEffect(() => {
    console.log("API BASE URL:", API_BASE_URL);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!preference.trim()) {
      setError('Please enter your movie preferences or select category/year');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setSearched(true);
    setMovies([]);

    console.log('Submitting request with:', { query: preference, session_id: sessionId });

    try {
      const response = await fetch(`${API_BASE_URL}/api/recommend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: preference,
          session_id: sessionId
        })
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Response data:', data);
      
      if (data.success && data.movies) {
        setMovies(data.movies);
        setSuccess(`Found ${data.movies.length} amazing movies for you!`);
        loadHistory(sessionId);
      } else {
        setError(data.error || 'Failed to get recommendations');
      }
    } catch (err) {
      console.error('Error details:', err);
      setError(`Connection error: ${err.message}. Make sure backend is running on port 5000.`);
    } finally {
      setLoading(false);
    }
  };

  const loadHistoryItem = (recommendation) => {
    setPreference(recommendation.query);
    setMovies(recommendation.movies);
    setSearched(true);
    setShowHistory(false);
    setSuccess(`Loaded ${recommendation.movies.length} movies from history`);
  };

  const clearHistory = async () => {
    if (!window.confirm('Are you sure you want to clear your history?')) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/clear-history/${sessionId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      if (data.success) {
        setHistory([]);
        setSuccess('History cleared successfully!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Failed to clear history:', err);
      setError('Failed to clear history');
    }
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #020617 0%, #1e3a8a 50%, #0f172a 100%)',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    bgGlow1: {
      position: 'fixed',
      top: '25%',
      left: '25%',
      width: '384px',
      height: '384px',
      background: 'rgba(59, 130, 246, 0.2)',
      borderRadius: '50%',
      filter: 'blur(80px)',
      pointerEvents: 'none',
    },
    bgGlow2: {
      position: 'fixed',
      bottom: '25%',
      right: '25%',
      width: '384px',
      height: '384px',
      background: 'rgba(99, 102, 241, 0.2)',
      borderRadius: '50%',
      filter: 'blur(80px)',
      pointerEvents: 'none',
    },
    mainContent: {
      position: 'relative',
      zIndex: 10,
      maxWidth: '1280px',
      margin: '0 auto',
      padding: '48px 16px',
    },
    header: {
      textAlign: 'center',
      marginBottom: '64px',
      paddingTop: '32px',
    },
    iconWrapper: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '96px',
      height: '96px',
      background: 'linear-gradient(135deg, #60a5fa, #6366f1)',
      borderRadius: '24px',
      marginBottom: '32px',
      boxShadow: '0 20px 50px rgba(59, 130, 246, 0.5)',
    },
    title: {
      fontSize: '64px',
      fontWeight: 'bold',
      background: 'linear-gradient(90deg, #bfdbfe, #a5b4fc, #bfdbfe)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      marginBottom: '16px',
      letterSpacing: '-0.025em',
    },
    subtitle: {
      fontSize: '20px',
      color: 'rgba(191, 219, 254, 0.8)',
      maxWidth: '768px',
      margin: '0 auto',
      fontWeight: '300',
    },
    searchCard: {
      background: 'rgba(15, 23, 42, 0.8)',
      backdropFilter: 'blur(20px)',
      borderRadius: '24px',
      padding: '32px',
      border: '1px solid rgba(59, 130, 246, 0.2)',
      boxShadow: '0 0 40px rgba(59, 130, 246, 0.15)',
      maxWidth: '896px',
      margin: '0 auto 64px',
    },
    dropdownContainer: {
      display: 'flex',
      gap: '16px',
      marginBottom: '24px',
      flexWrap: 'wrap',
    },
    dropdownWrapper: {
      position: 'relative',
      flex: 1,
      minWidth: '200px',
    },
    dropdownButton: {
      width: '100%',
      padding: '14px 20px',
      background: 'rgba(30, 41, 59, 0.8)',
      border: '1px solid rgba(59, 130, 246, 0.3)',
      borderRadius: '12px',
      color: '#bfdbfe',
      fontSize: '15px',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      transition: 'all 0.3s',
    },
    dropdownMenu: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      marginTop: '8px',
      background: 'rgba(15, 23, 42, 0.95)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(59, 130, 246, 0.3)',
      borderRadius: '16px',
      padding: '8px',
      maxHeight: '320px',
      overflowY: 'auto',
      zIndex: 1000,
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
    },
    dropdownGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '6px',
    },
    dropdownItem: {
      padding: '12px 16px',
      background: 'rgba(30, 41, 59, 0.5)',
      border: '1px solid rgba(59, 130, 246, 0.2)',
      borderRadius: '8px',
      color: '#bfdbfe',
      fontSize: '14px',
      cursor: 'pointer',
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    dropdownItemActive: {
      background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.3), rgba(99, 102, 241, 0.3))',
      borderColor: 'rgba(96, 165, 250, 0.6)',
      color: '#dbeafe',
    },
    textarea: {
      width: '100%',
      padding: '16px 24px',
      background: 'rgba(30, 41, 59, 0.5)',
      border: '1px solid rgba(59, 130, 246, 0.3)',
      borderRadius: '16px',
      color: '#eff6ff',
      fontSize: '16px',
      fontFamily: 'inherit',
      resize: 'none',
      outline: 'none',
    },
    buttonContainer: {
      marginTop: '24px',
      display: 'flex',
      flexWrap: 'wrap',
      gap: '12px',
      justifyContent: 'center',
    },
    primaryButton: {
      padding: '16px 32px',
      background: 'linear-gradient(90deg, #3b82f6, #6366f1)',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      fontWeight: '600',
      fontSize: '16px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      transition: 'all 0.3s',
      boxShadow: '0 8px 24px rgba(59, 130, 246, 0.3)',
    },
    secondaryButton: {
      padding: '16px 24px',
      background: 'rgba(30, 41, 59, 0.5)',
      color: '#bfdbfe',
      border: '1px solid rgba(59, 130, 246, 0.2)',
      borderRadius: '12px',
      fontWeight: '600',
      fontSize: '16px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    errorBox: {
      marginTop: '16px',
      padding: '16px',
      background: 'rgba(239, 68, 68, 0.1)',
      border: '1px solid rgba(239, 68, 68, 0.3)',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    successBox: {
      marginTop: '16px',
      padding: '16px',
      background: 'rgba(34, 197, 94, 0.1)',
      border: '1px solid rgba(34, 197, 94, 0.3)',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    loadingContainer: {
      textAlign: 'center',
      padding: '64px 0',
    },
    spinner: {
      width: '64px',
      height: '64px',
      border: '4px solid rgba(59, 130, 246, 0.2)',
      borderTop: '4px solid #3b82f6',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      margin: '0 auto 16px',
    },
    movieCard: {
      background: 'rgba(15, 23, 42, 0.6)',
      backdropFilter: 'blur(20px)',
      borderRadius: '24px',
      padding: '32px',
      border: '1px solid rgba(59, 130, 246, 0.2)',
      marginBottom: '24px',
      transition: 'all 0.5s',
    },
    movieContent: {
      display: 'flex',
      gap: '32px',
    },
    posterBox: {
      width: '192px',
      height: '288px',
      background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.2), rgba(99, 102, 241, 0.2))',
      borderRadius: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '1px solid rgba(59, 130, 246, 0.3)',
      flexShrink: 0,
    },
    movieTitle: {
      fontSize: '32px',
      fontWeight: 'bold',
      background: 'linear-gradient(90deg, #dbeafe, #c7d2fe)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      marginBottom: '16px',
    },
    badge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '6px 12px',
      background: 'rgba(59, 130, 246, 0.1)',
      border: '1px solid rgba(59, 130, 246, 0.3)',
      borderRadius: '8px',
      color: '#93c5fd',
      fontSize: '14px',
      marginRight: '16px',
    },
    ratingBox: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      background: 'linear-gradient(90deg, rgba(234, 179, 8, 0.2), rgba(249, 115, 22, 0.2))',
      padding: '12px 20px',
      borderRadius: '12px',
      border: '1px solid rgba(234, 179, 8, 0.4)',
    },
    description: {
      color: 'rgba(239, 246, 255, 0.8)',
      lineHeight: '1.6',
      fontSize: '16px',
      marginTop: '16px',
    },
    historyCard: {
      background: 'rgba(30, 41, 59, 0.5)',
      borderRadius: '12px',
      padding: '16px',
      border: '1px solid rgba(59, 130, 246, 0.2)',
      marginBottom: '12px',
      cursor: 'pointer',
      transition: 'all 0.3s',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.bgGlow1}></div>
      <div style={styles.bgGlow2}></div>

      <div style={styles.mainContent}>
        <div style={styles.header}>
          <div style={styles.iconWrapper}>
            <Film size={48} color="white" />
          </div>
          <h1 style={styles.title}>CineAI</h1>
          <p style={styles.subtitle}>
            Transform your movie discovery with AI-powered intelligence
          </p>
        </div>

        <div style={styles.searchCard}>
          <div style={styles.dropdownContainer}>
            <div style={styles.dropdownWrapper} ref={genreDropdownRef}>
              <button
                onClick={() => setShowGenreDropdown(!showGenreDropdown)}
                style={styles.dropdownButton}
              >
                <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                  <Film size={18} />
                  <span>
                    {selectedCategories.length > 0 
                      ? selectedCategories.length === 1 
                        ? selectedCategories[0]
                        : `${selectedCategories.length} Genres`
                      : 'Genre'}
                  </span>
                </div>
                <ChevronDown size={18} />
              </button>

              {showGenreDropdown && (
                <div style={styles.dropdownMenu}>
                  <div style={styles.dropdownGrid}>
                    {categories.map((category) => (
                      <button
                        key={category}
                        onClick={() => handleCategorySelect(category)}
                        style={{
                          ...styles.dropdownItem,
                          ...(selectedCategories.includes(category) ? styles.dropdownItemActive : {})
                        }}
                      >
                        <span>{category}</span>
                        {selectedCategories.includes(category) && <ChevronRight size={14} />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={styles.dropdownWrapper} ref={yearDropdownRef}>
              <button
                onClick={() => setShowYearDropdown(!showYearDropdown)}
                style={styles.dropdownButton}
              >
                <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                  <Calendar size={18} />
                  <span>
                    {selectedYears.length > 0 
                      ? selectedYears.length === 1 
                        ? selectedYears[0]
                        : `${selectedYears.length} Years`
                      : 'By Year'}
                  </span>
                </div>
                <ChevronDown size={18} />
              </button>

              {showYearDropdown && (
                <div style={styles.dropdownMenu}>
                  <div style={styles.dropdownGrid}>
                    {yearRanges.map((year) => (
                      <button
                        key={year}
                        onClick={() => handleYearSelect(year)}
                        style={{
                          ...styles.dropdownItem,
                          ...(selectedYears.includes(year) ? styles.dropdownItemActive : {})
                        }}
                      >
                        <span>{year}</span>
                        {selectedYears.includes(year) && <ChevronRight size={14} />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <textarea
            value={preference}
            onChange={(e) => setPreference(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.ctrlKey) {
                handleSubmit(e);
              }
            }}
            placeholder="Your selection will appear here, or type custom preferences..."
            style={styles.textarea}
            rows="3"
            disabled={loading}
          />
          
          <div style={styles.buttonContainer}>
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{...styles.primaryButton, opacity: loading ? 0.6 : 1}}
            >
              {loading ? (
                <>
                  <div style={{width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 1s linear infinite'}}></div>
                  <span>Discovering Movies...</span>
                </>
              ) : (
                <>
                  <Search size={20} />
                  <span>Get Recommendations</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                setPreference('');
                setMovies([]);
                setSearched(false);
                setError('');
                setSuccess('');
                setSelectedCategories([]);
                setSelectedYears([]);
              }}
              style={styles.secondaryButton}
            >
              <Sparkles size={20} />
              <span>Clear</span>
            </button>

            <button
              onClick={() => setShowAnalytics(!showAnalytics)}
              style={styles.secondaryButton}
            >
              <BarChart3 size={20} />
              <span>Analytics</span>
            </button>

            {history.length > 0 && (
              <button
                onClick={() => setShowHistory(!showHistory)}
                style={styles.secondaryButton}
              >
                <History size={20} />
                <span>History ({history.length})</span>
              </button>
            )}
          </div>

          {error && (
            <div style={styles.errorBox}>
              <div style={{width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%'}}></div>
              <p style={{color: '#fca5a5', fontSize: '14px', margin: 0}}>{error}</p>
            </div>
          )}

          {success && (
            <div style={styles.successBox}>
              <div style={{width: '8px', height: '8px', background: '#22c55e', borderRadius: '50%'}}></div>
              <p style={{color: '#86efac', fontSize: '14px', margin: 0}}>{success}</p>
            </div>
          )}

          {showHistory && history.length > 0 && (
            <div style={{marginTop: '24px'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
                <h3 style={{color: '#dbeafe', fontSize: '18px', margin: 0}}>Recent Searches</h3>
                <button onClick={clearHistory} style={{padding: '8px 16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#fca5a5', fontSize: '12px', cursor: 'pointer'}}>
                  Clear All
                </button>
              </div>
              {history.map((item) => (
                <div key={item.id} onClick={() => loadHistoryItem(item)} style={styles.historyCard}>
                  <p style={{color: '#93c5fd', fontSize: '14px', margin: '0 0 8px 0'}}>{item.query}</p>
                  <p style={{color: 'rgba(147, 197, 253, 0.6)', fontSize: '12px', margin: 0}}>
                    {item.movies.length} movies • {new Date(item.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {loading && (
          <div style={styles.loadingContainer}>
            <div style={styles.spinner}></div>
            <div style={{color: '#93c5fd', fontSize: '18px'}}>
              <Sparkles size={20} style={{display: 'inline', marginRight: '8px'}} />
              Curating your perfect watchlist...
            </div>
          </div>
        )}

        {movies.length > 0 && (
          <div>
            <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px'}}>
              <TrendingUp size={28} color="#60a5fa" />
              <h2 style={{fontSize: '36px', fontWeight: 'bold', background: 'linear-gradient(90deg, #bfdbfe, #a5b4fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0}}>
                Curated For You
              </h2>
            </div>
            
            {movies.map((movie, index) => (
              <div key={index} style={styles.movieCard}>
                <div style={styles.movieContent}>
                  <div style={styles.posterBox}>
                    <Film size={64} color="rgba(96, 165, 250, 0.6)" />
                  </div>

                  <div style={{flex: 1}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px'}}>
                      <div style={{flex: 1}}>
                        <h3 style={styles.movieTitle}>{movie.title}</h3>
                        <div>
                          <span style={styles.badge}>
                            <Calendar size={16} />
                            {movie.year}
                          </span>
                          <span style={{...styles.badge, background: 'rgba(99, 102, 241, 0.1)', borderColor: 'rgba(99, 102, 241, 0.3)', color: '#c7d2fe'}}>
                            <Clock size={16} />
                            {movie.genre}
                          </span>
                        </div>
                      </div>
                      <div style={styles.ratingBox}>
                        <Star size={20} color="#facc15" fill="#facc15" />
                        <span style={{fontSize: '24px', fontWeight: 'bold', color: '#facc15'}}>{movie.rating}</span>
                      </div>
                    </div>
                    
                    <p style={styles.description}>{movie.description}</p>

                    <div style={{display: 'flex', gap: '12px', marginTop: '16px'}}>
                      <button style={{padding: '10px 20px', background: 'rgba(59, 130, 246, 0.2)', border: '1px solid rgba(59, 130, 246, 0.4)', color: '#93c5fd', borderRadius: '12px', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'}}>
                        <Play size={16} />
                        Watch Trailer
                      </button>
                      <button style={{padding: '10px 20px', background: 'rgba(30, 41, 59, 0.4)', border: '1px solid rgba(59, 130, 246, 0.2)', color: '#60a5fa', borderRadius: '12px', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'}}>
                        <Share2 size={16} />
                        Share
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !searched && (
          <div style={{maxWidth: '1200px', margin: '0 auto'}}>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px'}}>
              {[
                { icon: Sparkles, title: 'AI-Powered Intelligence', desc: 'Advanced algorithms understand your taste' },
                { icon: Star, title: 'Personalized Curation', desc: 'Tailored recommendations just for you' },
                { icon: Film, title: 'Vast Movie Library', desc: 'Discover gems across all genres' }
              ].map((feature, i) => (
                <div key={i} style={{background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(20px)', borderRadius: '16px', padding: '32px', border: '1px solid rgba(59, 130, 246, 0.2)', textAlign: 'center'}}>
                  <div style={{width: '56px', height: '56px', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px'}}>
                    <feature.icon size={28} color="white" />
                  </div>
                  <h3 style={{color: '#dbeafe', fontWeight: 'bold', fontSize: '18px', marginBottom: '8px'}}>{feature.title}</h3>
                  <p style={{color: 'rgba(147, 197, 253, 0.6)', fontSize: '14px', lineHeight: '1.5', margin: 0}}>{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        * {
          box-sizing: border-box;
        }
        
        body {
          margin: 0;
          padding: 0;
        }

        *::-webkit-scrollbar {
          width: 8px;
        }
        
        *::-webkit-scrollbar-track {
          background: rgba(30, 41, 59, 0.3);
          border-radius: 4px;
        }
        
        *::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.5);
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}

export default App;