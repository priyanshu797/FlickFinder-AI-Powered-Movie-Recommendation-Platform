import React, { useState, useEffect, useRef } from 'react';
import { Film, Sparkles, Search, Star, Calendar, Clock, TrendingUp, Play, Share2, BarChart3, ChevronDown, ChevronRight, History, BookmarkPlus, Award, Users, Zap, Info, Heart, ExternalLink } from 'lucide-react';

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
  const [sessionId, setSessionId] = useState('');
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const genreDropdownRef = useRef(null);
  const yearDropdownRef = useRef(null);

  useEffect(() => {
    let storedSessionId = localStorage.getItem('flickfinder_session_id');
    if (!storedSessionId) {
      storedSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('flickfinder_session_id', storedSessionId);
    }
    setSessionId(storedSessionId);
    
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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.movies) {
        setMovies(data.movies);
        setSuccess(`Found ${data.movies.length} amazing movies for you!`);
        loadHistory(sessionId);
      } else {
        setError(data.error || 'Failed to get recommendations');
      }
    } catch (err) {
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

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0e27',
      position: 'relative',
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      {/* Animated Background Pattern */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.03,
        backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.05) 35px, rgba(255,255,255,.05) 70px)',
        pointerEvents: 'none',
      }}></div>

      {/* Sidebar Navigation */}
      <div style={{
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        width: '80px',
        background: 'rgba(15, 20, 45, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(255, 255, 255, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '30px 0',
        zIndex: 100,
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          background: 'linear-gradient(135deg, #ff6b6b, #ff8e53)',
          borderRadius: '15px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '40px',
          boxShadow: '0 10px 30px rgba(255, 107, 107, 0.3)',
        }}>
          <Sparkles size={26} color="white" />
        </div>

        <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: '20px'}}>
          <div style={{
            width: '50px',
            height: '50px',
            background: 'rgba(255, 107, 107, 0.15)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s',
          }}>
            <Search size={22} color="#ff6b6b" />
          </div>
          <div style={{
            width: '50px',
            height: '50px',
            background: 'transparent',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s',
          }}>
            <TrendingUp size={22} color="rgba(255, 255, 255, 0.3)" />
          </div>
          <div style={{
            width: '50px',
            height: '50px',
            background: 'transparent',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s',
          }}>
            <Heart size={22} color="rgba(255, 255, 255, 0.3)" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        marginLeft: '80px',
        padding: '40px 60px',
        minHeight: '100vh',
      }}>
        {/* Top Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '50px',
        }}>
          <div>
            <h1 style={{
              fontSize: '42px',
              fontWeight: '800',
              color: '#ffffff',
              margin: '0 0 8px 0',
              letterSpacing: '-0.02em',
            }}>FlickFinder</h1>
            <p style={{
              fontSize: '16px',
              color: 'rgba(255, 255, 255, 0.4)',
              margin: 0,
            }}>AI-Powered Movie Discovery Platform</p>
          </div>
          
          {history.length > 0 && (
            <button
              onClick={() => setShowHistory(!showHistory)}
              style={{
                padding: '12px 24px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <History size={18} />
              History ({history.length})
            </button>
          )}
        </div>

        {/* Search Section */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '20px',
          padding: '40px',
          marginBottom: '50px',
        }}>
          <div style={{
            display: 'flex',
            gap: '16px',
            marginBottom: '20px',
          }}>
            {/* Genre Dropdown */}
            <div style={{ position: 'relative', flex: 1 }} ref={genreDropdownRef}>
              <button
                onClick={() => setShowGenreDropdown(!showGenreDropdown)}
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.3s',
                }}
              >
                <span>
                  {selectedCategories.length > 0 
                    ? selectedCategories.join(', ')
                    : '🎬 Select Genres'}
                </span>
                <ChevronDown size={18} />
              </button>

              {showGenreDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: '8px',
                  background: 'rgba(15, 20, 45, 0.98)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px',
                  padding: '12px',
                  maxHeight: '350px',
                  overflowY: 'auto',
                  zIndex: 1000,
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6)',
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {categories.map((category) => (
                      <button
                        key={category}
                        onClick={() => handleCategorySelect(category)}
                        style={{
                          padding: '12px 16px',
                          background: selectedCategories.includes(category) 
                            ? 'linear-gradient(135deg, rgba(255, 107, 107, 0.2), rgba(255, 142, 83, 0.2))' 
                            : 'transparent',
                          border: 'none',
                          borderRadius: '10px',
                          color: selectedCategories.includes(category) ? '#ffffff' : 'rgba(255, 255, 255, 0.6)',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          textAlign: 'left',
                        }}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Year Dropdown */}
            <div style={{ position: 'relative', flex: 1 }} ref={yearDropdownRef}>
              <button
                onClick={() => setShowYearDropdown(!showYearDropdown)}
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.3s',
                }}
              >
                <span>
                  {selectedYears.length > 0 
                    ? selectedYears.join(', ')
                    : '📅 Select Years'}
                </span>
                <ChevronDown size={18} />
              </button>

              {showYearDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: '8px',
                  background: 'rgba(15, 20, 45, 0.98)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px',
                  padding: '12px',
                  maxHeight: '350px',
                  overflowY: 'auto',
                  zIndex: 1000,
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6)',
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                    {yearRanges.map((year) => (
                      <button
                        key={year}
                        onClick={() => handleYearSelect(year)}
                        style={{
                          padding: '12px',
                          background: selectedYears.includes(year) 
                            ? 'linear-gradient(135deg, rgba(255, 107, 107, 0.2), rgba(255, 142, 83, 0.2))' 
                            : 'transparent',
                          border: 'none',
                          borderRadius: '10px',
                          color: selectedYears.includes(year) ? '#ffffff' : 'rgba(255, 255, 255, 0.6)',
                          fontSize: '13px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
          }}>
            <input
              type="text"
              value={preference}
              onChange={(e) => setPreference(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSubmit(e);
                }
              }}
              placeholder="Describe your mood or what you want to watch..."
              style={{
                flex: 1,
                padding: '18px 24px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                color: '#ffffff',
                fontSize: '15px',
                fontFamily: 'inherit',
                outline: 'none',
              }}
              disabled={loading}
            />
            
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                padding: '18px 36px',
                background: loading ? 'rgba(255, 107, 107, 0.5)' : 'linear-gradient(135deg, #ff6b6b, #ff8e53)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontWeight: '600',
                fontSize: '15px',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                transition: 'all 0.3s',
                boxShadow: '0 8px 24px rgba(255, 107, 107, 0.3)',
                whiteSpace: 'nowrap',
              }}
            >
              {loading ? (
                <>
                  <div style={{width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 1s linear infinite'}}></div>
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Search size={18} />
                  <span>Find Movies</span>
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
              style={{
                padding: '18px',
                background: 'rgba(255, 255, 255, 0.03)',
                color: 'rgba(255, 255, 255, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                fontWeight: '600',
                fontSize: '15px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Sparkles size={18} />
            </button>
          </div>

          {error && (
            <div style={{
              marginTop: '16px',
              padding: '14px 18px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '10px',
              color: '#fca5a5',
              fontSize: '14px',
            }}>{error}</div>
          )}

          {success && (
            <div style={{
              marginTop: '16px',
              padding: '14px 18px',
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: '10px',
              color: '#86efac',
              fontSize: '14px',
            }}>{success}</div>
          )}

          {showHistory && history.length > 0 && (
            <div style={{marginTop: '24px', paddingTop: '24px', borderTop: '1px solid rgba(255, 255, 255, 0.05)'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
                <h3 style={{color: 'rgba(255, 255, 255, 0.8)', fontSize: '16px', fontWeight: '600', margin: 0}}>Recent Searches</h3>
                <button onClick={clearHistory} style={{padding: '6px 12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#fca5a5', fontSize: '12px', cursor: 'pointer'}}>
                  Clear All
                </button>
              </div>
              {history.map((item) => (
                <div key={item.id} onClick={() => loadHistoryItem(item)} style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  marginBottom: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                }}>
                  <p style={{color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', margin: '0 0 6px 0'}}>{item.query}</p>
                  <p style={{color: 'rgba(255, 255, 255, 0.4)', fontSize: '12px', margin: 0}}>
                    {item.movies.length} movies • {new Date(item.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{
              width: '60px',
              height: '60px',
              border: '4px solid rgba(255, 107, 107, 0.2)',
              borderTop: '4px solid #ff6b6b',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 24px',
            }}></div>
            <div style={{color: 'rgba(255, 255, 255, 0.6)', fontSize: '16px', fontWeight: '500'}}>
              Searching our vast movie library...
            </div>
          </div>
        )}

        {/* Movies - Horizontal Scroll Layout */}
        {movies.length > 0 && (
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '30px',
            }}>
              <h2 style={{
                fontSize: '28px',
                fontWeight: '700',
                color: '#ffffff',
                margin: 0,
              }}>
                Recommended for You
              </h2>
              <span style={{
                fontSize: '14px',
                color: 'rgba(255, 255, 255, 0.4)',
              }}>
                {movies.length} movies found
              </span>
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))',
              gap: '20px',
            }}>
              {movies.map((movie, index) => (
                <div key={index} style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  flexDirection: 'row',
                  height: '220px',
                }}>
                  {/* Left: Poster */}
                  <div style={{
                    width: '160px',
                    background: 'linear-gradient(135deg, rgba(255, 107, 107, 0.15), rgba(255, 142, 83, 0.15))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    position: 'relative',
                  }}>
                    <Film size={50} color="rgba(255, 255, 255, 0.1)" strokeWidth={1.5} />
                    
                    {/* Rating Badge */}
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                      padding: '6px 10px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      boxShadow: '0 4px 12px rgba(251, 191, 36, 0.4)',
                    }}>
                      <Star size={12} color="#ffffff" fill="#ffffff" />
                      <span style={{fontSize: '13px', fontWeight: 'bold', color: '#ffffff'}}>{movie.rating}</span>
                    </div>
                  </div>

                  {/* Right: Content */}
                  <div style={{
                    flex: 1,
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                  }}>
                    {/* Title */}
                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: '700',
                      color: '#ffffff',
                      margin: '0 0 10px 0',
                      lineHeight: '1.3',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}>{movie.title}</h3>

                    {/* Meta */}
                    <div style={{
                      display: 'flex',
                      gap: '10px',
                      marginBottom: '12px',
                      flexWrap: 'wrap',
                    }}>
                      <span style={{
                        fontSize: '12px',
                        color: 'rgba(255, 255, 255, 0.5)',
                        background: 'rgba(255, 255, 255, 0.05)',
                        padding: '4px 10px',
                        borderRadius: '6px',
                      }}>
                        {movie.year}
                      </span>
                      <span style={{
                        fontSize: '12px',
                        color: 'rgba(255, 255, 255, 0.5)',
                        background: 'rgba(255, 255, 255, 0.05)',
                        padding: '4px 10px',
                        borderRadius: '6px',
                      }}>
                        {movie.genre}
                      </span>
                    </div>

                    {/* Description */}
                    <p style={{
                      color: 'rgba(255, 255, 255, 0.5)',
                      lineHeight: '1.6',
                      fontSize: '13px',
                      margin: '0 0 auto 0',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                    }}>{movie.description}</p>

                    {/* Actions */}
                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      marginTop: '14px',
                    }}>
                      <button style={{
                        flex: 1,
                        padding: '8px 12px',
                        background: 'linear-gradient(135deg, #ff6b6b, #ff8e53)',
                        border: 'none',
                        color: '#ffffff',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'all 0.3s',
                      }}>
                        <Play size={14} />
                        Watch
                      </button>
                      <button style={{
                        padding: '8px 12px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: 'rgba(255, 255, 255, 0.6)',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.3s',
                      }}>
                        <BookmarkPlus size={14} />
                      </button>
                      <button style={{
                        padding: '8px 12px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: 'rgba(255, 255, 255, 0.6)',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.3s',
                      }}>
                        <Share2 size={14} />
                      </button>
                      <button style={{
                        padding: '8px 12px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: 'rgba(255, 255, 255, 0.6)',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.3s',
                      }}>
                        <Info size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feature Cards - When No Search */}
        {!loading && !searched && (
          <div style={{marginTop: '60px'}}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#ffffff',
              marginBottom: '30px',
            }}>Why Choose FlickFinder?</h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px',
            }}>
              {[
                { 
                  icon: Zap, 
                  title: 'Lightning Fast', 
                  desc: 'Get instant movie recommendations powered by advanced AI algorithms',
                  color: '#ff6b6b',
                  gradient: 'linear-gradient(135deg, #ff6b6b, #ff8e53)',
                },
                { 
                  icon: Award, 
                  title: 'Quality Picks', 
                  desc: 'Curated selection of highly-rated movies across all genres',
                  color: '#fbbf24',
                  gradient: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                },
                { 
                  icon: Users, 
                  title: 'Personalized', 
                  desc: 'Recommendations tailored to your unique taste and preferences',
                  color: '#8b5cf6',
                  gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                }
              ].map((feature, i) => (
                <div key={i} style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: '16px',
                  padding: '32px 24px',
                  transition: 'all 0.3s',
                  textAlign: 'center',
                }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    background: feature.gradient,
                    borderRadius: '16px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '20px',
                    boxShadow: `0 10px 30px ${feature.color}40`,
                  }}>
                    <feature.icon size={28} color="white" />
                  </div>
                  <h3 style={{
                    color: '#ffffff',
                    fontWeight: '700',
                    fontSize: '18px',
                    marginBottom: '10px'
                  }}>{feature.title}</h3>
                  <p style={{
                    color: 'rgba(255, 255, 255, 0.5)',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    margin: 0
                  }}>{feature.desc}</p>
                </div>
              ))}
            </div>

            {/* Stats Section */}
            <div style={{
              marginTop: '40px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '20px',
            }}>
              <div style={{
                background: 'rgba(255, 107, 107, 0.05)',
                border: '1px solid rgba(255, 107, 107, 0.2)',
                borderRadius: '16px',
                padding: '24px',
                textAlign: 'center',
              }}>
                <div style={{
                  fontSize: '32px',
                  fontWeight: '800',
                  color: '#ff6b6b',
                  marginBottom: '8px',
                }}>10K+</div>
                <div style={{
                  fontSize: '14px',
                  color: 'rgba(255, 255, 255, 0.5)',
                }}>Movies Database</div>
              </div>
              
              <div style={{
                background: 'rgba(251, 191, 36, 0.05)',
                border: '1px solid rgba(251, 191, 36, 0.2)',
                borderRadius: '16px',
                padding: '24px',
                textAlign: 'center',
              }}>
                <div style={{
                  fontSize: '32px',
                  fontWeight: '800',
                  color: '#fbbf24',
                  marginBottom: '8px',
                }}>98%</div>
                <div style={{
                  fontSize: '14px',
                  color: 'rgba(255, 255, 255, 0.5)',
                }}>Match Accuracy</div>
              </div>
              
              <div style={{
                background: 'rgba(139, 92, 246, 0.05)',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                borderRadius: '16px',
                padding: '24px',
                textAlign: 'center',
              }}>
                <div style={{
                  fontSize: '32px',
                  fontWeight: '800',
                  color: '#8b5cf6',
                  marginBottom: '8px',
                }}>50K+</div>
                <div style={{
                  fontSize: '14px',
                  color: 'rgba(255, 255, 255, 0.5)',
                }}>Happy Users</div>
              </div>
              
              <div style={{
                background: 'rgba(236, 72, 153, 0.05)',
                border: '1px solid rgba(236, 72, 153, 0.2)',
                borderRadius: '16px',
                padding: '24px',
                textAlign: 'center',
              }}>
                <div style={{
                  fontSize: '32px',
                  fontWeight: '800',
                  color: '#ec4899',
                  marginBottom: '8px',
                }}>24/7</div>
                <div style={{
                  fontSize: '14px',
                  color: 'rgba(255, 255, 255, 0.5)',
                }}>AI Support</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Global Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        * {
          box-sizing: border-box;
        }
        
        body {
          margin: 0;
          padding: 0;
          overflow-x: hidden;
        }

        *::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        *::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
        }
        
        *::-webkit-scrollbar-thumb {
          background: rgba(255, 107, 107, 0.3);
          border-radius: 4px;
        }

        *::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 107, 107, 0.5);
        }

        button:hover {
          transform: translateY(-1px);
          opacity: 0.9;
        }

        button:active {
          transform: translateY(0);
        }

        input:focus {
          border-color: rgba(255, 107, 107, 0.4);
          box-shadow: 0 0 0 3px rgba(255, 107, 107, 0.1);
        }

        @media (max-width: 768px) {
          .sidebar {
            width: 60px !important;
          }
          
          .main-content {
            margin-left: 60px !important;
            padding: 20px 20px !important;
          }
        }
      `}</style>
    </div>
  );
}

export default App;
