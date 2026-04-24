import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';

// ============= SUPABASE CONFIG =============
const SUPABASE_URL = 'https://peymwntazavsptycyxtp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBleW213bnRhemF2c3B0eWN5eHRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwMjI4MTIsImV4cCI6MjA5MjU5ODgxMn0.yv3B3wPCllnzoam0gMqEicVJrSFSjP4oRNiL8nrpHeY';

let supabase = null;

const initSupabase = async () => {
  if (!supabase) {
    const { createClient } = await import('@supabase/supabase-js');
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabase;
};

// ============= CONSTANTS =============
const DEMO_USER = {
  id: 'demo-user',
  username: 'demo_user',
  full_name: 'Демо Пользователь',
  email: 'demo@test.com',
  avatar_url: '👤',
  bio: 'Демонстрационный аккаунт',
  online_status: 'online'
};

const DEMO_USERS = [
  { id: 'user1', full_name: 'Иван Петров', username: 'ivan_petrov', email: 'ivan@test.com', avatar_url: '🧑‍🦰', bio: 'Frontend разработчик', online_status: 'online' },
  { id: 'user2', full_name: 'Мария Сидорова', username: 'maria_sidor', email: 'maria@test.com', avatar_url: '👩', bio: 'Дизайнер', online_status: 'online' },
  { id: 'user3', full_name: 'Сергей Смирнов', username: 'sergey_smir', email: 'sergey@test.com', avatar_url: '👨‍💼', bio: 'Product Manager', online_status: 'away' }
];

const DEMO_POSTS = [
  {
    id: 1,
    user_id: 'user1',
    content: '🐗 Привет! Это демо версия KabanChat - супер крутого социального месенджера!',
    image_url: null,
    users: { full_name: 'Иван Петров', username: 'ivan_petrov', avatar_url: '🧑‍🦰' },
    created_at: new Date().toISOString(),
    post_reactions: [{ emoji: '❤️', count: 42 }, { emoji: '😂', count: 15 }]
  },
  {
    id: 2,
    user_id: 'user2',
    content: 'Мой первый пост в ленте 📝 Здесь можно писать всё!',
    image_url: null,
    users: { full_name: 'Мария Сидорова', username: 'maria_sidor', avatar_url: '👩' },
    created_at: new Date(Date.now() - 3600000).toISOString(),
    post_reactions: [{ emoji: '❤️', count: 28 }]
  }
];

const EMOJI_REACTIONS = ['❤️', '😂', '😍', '😮', '😢', '🔥', '👍'];

// ============= MAIN APP =============
function App() {
  const [page, setPage] = useState('welcome');
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState('dark'); // 'dark', 'light', 'sepia', 'high-contrast'
  const [showGuide, setShowGuide] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const checkAuth = async () => {
      await initSupabase();
      const stored = localStorage.getItem('kabanChat_user');
      if (stored) {
        const user = JSON.parse(stored);
        setCurrentUser(user);
        setIsAdmin(user.username === 'kaban');
        setPage(user.username === 'kaban' ? 'admin' : 'feed');
      } else {
        setPage('welcome');
      }
      
      // Загрузить тему
      const savedTheme = localStorage.getItem('kabanChat_theme') || 'dark';
      setTheme(savedTheme);
      
      setLoading(false);
    };
    checkAuth();
  }, []);

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('kabanChat_theme', newTheme);
  };

  const handleLogout = () => {
    localStorage.removeItem('kabanChat_user');
    setCurrentUser(null);
    setIsAdmin(false);
    setPage('welcome');
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className={`app ${theme}`}>
      {/* NAVBAR */}
      {currentUser && (
        <nav className="navbar">
          <div className="navbar-left">
            <h1 className="logo">🐗 KabanChat</h1>
            
            {!isAdmin && (
              <div className="nav-buttons">
                <button 
                  className={`nav-btn ${page === 'feed' ? 'active' : ''}`}
                  onClick={() => setPage('feed')}
                >
                  📰 Лента
                </button>
                <button 
                  className={`nav-btn ${page === 'messages' ? 'active' : ''}`}
                  onClick={() => setPage('messages')}
                >
                  💬 Чат
                </button>
                <button 
                  className={`nav-btn ${page === 'explore' ? 'active' : ''}`}
                  onClick={() => setPage('explore')}
                >
                  🔍 Поиск
                </button>
                <button 
                  className={`nav-btn ${page === 'profile' ? 'active' : ''}`}
                  onClick={() => setPage('profile')}
                >
                  👤 Профиль
                </button>
              </div>
            )}

            {isAdmin && (
              <div className="nav-buttons">
                <button 
                  className={`nav-btn ${page === 'admin' ? 'active' : ''}`}
                  onClick={() => setPage('admin')}
                >
                  ⚙️ Админ
                </button>
                <button 
                  className={`nav-btn ${page === 'admin-stats' ? 'active' : ''}`}
                  onClick={() => setPage('admin-stats')}
                >
                  📊 Статистика
                </button>
              </div>
            )}
          </div>

          <div className="navbar-right">
            {/* Уведомления */}
            <div className="notification-bell">
              <button className="bell-btn">
                🔔
                {notifications.length > 0 && (
                  <span className="notification-badge">{notifications.length}</span>
                )}
              </button>
            </div>

            {/* Темы */}
            <div className="theme-switcher">
              <select 
                value={theme} 
                onChange={(e) => handleThemeChange(e.target.value)}
                className="theme-select"
              >
                <option value="dark">🌙 Dark</option>
                <option value="light">☀️ Light</option>
                <option value="sepia">🎨 Sepia</option>
                <option value="high-contrast">♿ Контраст</option>
              </select>
            </div>

            <div className="user-info">
              <span>{currentUser?.avatar_url} {currentUser?.full_name}</span>
              <span className="online-status" data-status={currentUser?.online_status}></span>
            </div>

            <button 
              className="auth-btn logout-btn"
              onClick={handleLogout}
            >
              Выход
            </button>
          </div>
        </nav>
      )}

      {/* MAIN CONTENT */}
      <main className="main-content">
        {page === 'welcome' ? (
          <WelcomePage onAuth={(user) => {
            setCurrentUser(user);
            setIsAdmin(user.username === 'kaban');
            setShowGuide(true);
            setPage(user.username === 'kaban' ? 'admin' : 'feed');
          }} />
        ) : page === 'auth' ? (
          <AuthPage onAuth={(user) => {
            setCurrentUser(user);
            setIsAdmin(user.username === 'kaban');
            setPage(user.username === 'kaban' ? 'admin' : 'feed');
          }} />
        ) : isAdmin && page === 'admin' ? (
          <AdminPanel user={currentUser} />
        ) : isAdmin && page === 'admin-stats' ? (
          <AdminStats user={currentUser} />
        ) : page === 'feed' ? (
          <FeedPage user={currentUser} />
        ) : page === 'messages' ? (
          <MessengerPage user={currentUser} />
        ) : page === 'explore' ? (
          <ExplorePage user={currentUser} />
        ) : page === 'profile' ? (
          <ProfilePage user={currentUser} />
        ) : (
          <FeedPage user={currentUser} />
        )}
      </main>

      {/* GUIDE MODAL */}
      {showGuide && (
        <GuideModal onClose={() => setShowGuide(false)} />
      )}
    </div>
  );
}

// ============= WELCOME PAGE =============
function WelcomePage({ onAuth }) {
  const [showAuth, setShowAuth] = useState(false);

  if (showAuth) {
    return <AuthPage onAuth={onAuth} />;
  }

  return (
    <div className="welcome-page">
      <div className="welcome-container">
        <div className="welcome-hero">
          <div className="welcome-emoji">🐗</div>
          <h1>KabanChat</h1>
          <p>Социальный месенджер нового поколения</p>
        </div>

        <div className="welcome-features">
          <div className="feature-card">
            <div className="feature-icon">💬</div>
            <h3>Реальный чат</h3>
            <p>Общайтесь в реальном времени</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📰</div>
            <h3>Своя лента</h3>
            <p>Делитесь постами и фото</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">👥</div>
            <h3>Сообщество</h3>
            <p>Подписывайтесь и находите друзей</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⭐</div>
            <h3>Реакции</h3>
            <p>Выражайте эмодзи вместо текста</p>
          </div>
        </div>

        <div className="welcome-buttons">
          <button className="btn btn-primary" onClick={() => setShowAuth(true)}>
            🚀 Начать
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => {
              const user = DEMO_USER;
              localStorage.setItem('kabanChat_user', JSON.stringify(user));
              onAuth(user);
            }}
          >
            👁️ Посмотреть демо
          </button>
        </div>

        <p className="welcome-footer">
          KabanChat © 2024 | Все права защищены
        </p>
      </div>
    </div>
  );
}

// ============= GUIDE MODAL =============
function GuideModal({ onClose }) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: '📰 Добро пожаловать в ленту!',
      content: 'Здесь вы видите посты от всех пользователей. Кликните на ❤️ чтобы добавить реакцию!'
    },
    {
      title: '💬 Чат с друзьями',
      content: 'Откройте вкладку "Чат" чтобы написать личное сообщение. Вы увидите когда собеседник печатает...'
    },
    {
      title: '👥 Найди друзей',
      content: 'В разделе "Поиск" вы можете найти других пользователей и подписаться на них'
    },
    {
      title: '👤 Твой профиль',
      content: 'Загрузите аватар, напишите биографию и покажите миру кто вы!'
    }
  ];

  return (
    <div className="guide-modal-overlay" onClick={onClose}>
      <div className="guide-modal" onClick={(e) => e.stopPropagation()}>
        <button className="guide-close" onClick={onClose}>✕</button>
        <div className="guide-content">
          <div className="guide-step-number">{step + 1} / {steps.length}</div>
          <h2>{steps[step].title}</h2>
          <p>{steps[step].content}</p>
        </div>
        <div className="guide-buttons">
          <button 
            className="btn btn-secondary"
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
          >
            ← Назад
          </button>
          <div className="guide-dots">
            {steps.map((_, i) => (
              <div 
                key={i}
                className={`dot ${i === step ? 'active' : ''}`}
                onClick={() => setStep(i)}
              />
            ))}
          </div>
          {step === steps.length - 1 ? (
            <button className="btn btn-primary" onClick={onClose}>
              Начать! ✓
            </button>
          ) : (
            <button 
              className="btn btn-primary"
              onClick={() => setStep(Math.min(steps.length - 1, step + 1))}
            >
              Далее →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============= AUTH PAGE =============
function AuthPage({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({
    email: '',
    username: '',
    fullName: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePassword = (password) => {
    return password.length >= 6;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Проверка админа
      if (mode === 'login') {
        if (form.username === 'kaban' && form.password === 'admin123') {
          const adminUser = {
            id: 'admin-id',
            username: 'kaban',
            full_name: 'Администратор',
            email: 'admin@kaban.chat',
            avatar_url: '👨‍💼',
            bio: 'Администратор KabanChat',
            online_status: 'online'
          };
          localStorage.setItem('kabanChat_user', JSON.stringify(adminUser));
          onAuth(adminUser);
          return;
        }

        // Проверка обычного пользователя
        const user = DEMO_USERS.find(u => u.username === form.username);
        if (!user) {
          setError('Пользователь не найден');
          setLoading(false);
          return;
        }

        const newUser = {
          ...user,
          email: form.email || user.email,
          online_status: 'online'
        };
        localStorage.setItem('kabanChat_user', JSON.stringify(newUser));
        onAuth(newUser);
      } else {
        // Регистрация
        if (!form.email || !validateEmail(form.email)) {
          setError('Введите корректный email');
          setLoading(false);
          return;
        }
        if (!form.username || form.username.length < 3) {
          setError('Логин должен быть минимум 3 символа');
          setLoading(false);
          return;
        }
        if (!form.fullName) {
          setError('Введите ваше имя');
          setLoading(false);
          return;
        }
        if (!validatePassword(form.password)) {
          setError('Пароль должен быть минимум 6 символов');
          setLoading(false);
          return;
        }
        if (form.password !== form.confirmPassword) {
          setError('Пароли не совпадают');
          setLoading(false);
          return;
        }

        const newUser = {
          id: 'user-' + Math.random().toString(36).substr(2, 9),
          email: form.email,
          username: form.username,
          full_name: form.fullName,
          avatar_url: '👤',
          bio: 'Новый пользователь KabanChat',
          online_status: 'online'
        };
        localStorage.setItem('kabanChat_user', JSON.stringify(newUser));
        onAuth(newUser);
      }
    } catch (err) {
      setError('Ошибка: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-box">
          <div className="auth-header">
            <h1>🐗</h1>
            <h2>{mode === 'login' ? 'Вход' : 'Регистрация'}</h2>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            {mode === 'register' && (
              <>
                <input
                  type="email"
                  placeholder="Email"
                  value={form.email}
                  onChange={(e) => setForm({...form, email: e.target.value})}
                  required
                />
                <input
                  type="text"
                  placeholder="Логин (@username)"
                  value={form.username}
                  onChange={(e) => setForm({...form, username: e.target.value})}
                  required
                />
                <input
                  type="text"
                  placeholder="Полное имя"
                  value={form.fullName}
                  onChange={(e) => setForm({...form, fullName: e.target.value})}
                  required
                />
              </>
            )}

            {mode === 'login' && (
              <input
                type="text"
                placeholder="Логин или email"
                value={form.username}
                onChange={(e) => setForm({...form, username: e.target.value})}
                required
              />
            )}

            <input
              type="password"
              placeholder="Пароль"
              value={form.password}
              onChange={(e) => setForm({...form, password: e.target.value})}
              required
            />

            {mode === 'register' && (
              <input
                type="password"
                placeholder="Повторите пароль"
                value={form.confirmPassword}
                onChange={(e) => setForm({...form, confirmPassword: e.target.value})}
                required
              />
            )}

            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? 'Загружается...' : (mode === 'login' ? 'Вход' : 'Создать аккаунт')}
            </button>
          </form>

          <div className="auth-divider">или</div>

          {/* Google OAuth (симуляция) */}
          <button className="btn btn-google btn-block">
            🔐 Вход через Google
          </button>

          <div className="auth-footer">
            {mode === 'login' ? (
              <>
                Нет аккаунта? {' '}
                <button className="link-btn" onClick={() => {
                  setMode('register');
                  setForm({email: '', username: '', fullName: '', password: '', confirmPassword: ''});
                  setError('');
                }}>
                  Регистрация
                </button>
              </>
            ) : (
              <>
                Уже есть аккаунт? {' '}
                <button className="link-btn" onClick={() => {
                  setMode('login');
                  setForm({email: '', username: '', fullName: '', password: '', confirmPassword: ''});
                  setError('');
                }}>
                  Вход
                </button>
              </>
            )}
          </div>

          {/* Demo users */}
          {mode === 'login' && (
            <div className="demo-users">
              <p>Демо аккаунты:</p>
              <button 
                className="demo-btn"
                onClick={() => {
                  const user = DEMO_USERS[0];
                  localStorage.setItem('kabanChat_user', JSON.stringify(user));
                  onAuth(user);
                }}
              >
                {DEMO_USERS[0].avatar_url} {DEMO_USERS[0].username}
              </button>
              <button 
                className="demo-btn"
                onClick={() => {
                  const user = DEMO_USERS[1];
                  localStorage.setItem('kabanChat_user', JSON.stringify(user));
                  onAuth(user);
                }}
              >
                {DEMO_USERS[1].avatar_url} {DEMO_USERS[1].username}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============= FEED PAGE =============
function FeedPage({ user }) {
  const [posts, setPosts] = useState(DEMO_POSTS);
  const [newPost, setNewPost] = useState('');
  const [newPostImage, setNewPostImage] = useState('');
  const [expandedComments, setExpandedComments] = useState({});

  const handleCreatePost = (e) => {
    e.preventDefault();
    if (!newPost.trim()) return;

    const post = {
      id: posts.length + 1,
      user_id: user.id,
      content: newPost,
      image_url: newPostImage || null,
      users: { full_name: user.full_name, username: user.username, avatar_url: user.avatar_url },
      created_at: new Date().toISOString(),
      post_reactions: []
    };

    setPosts([post, ...posts]);
    setNewPost('');
    setNewPostImage('');
  };

  const toggleComments = (postId) => {
    setExpandedComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  return (
    <div className="feed-page">
      <div className="feed-container">
        {/* CREATE POST */}
        <div className="post-creator">
          <div className="post-creator-header">
            <span className="avatar">{user.avatar_url}</span>
            <input
              type="text"
              placeholder="Что нового? 📝"
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              className="post-input"
            />
          </div>
          <div className="post-creator-actions">
            <button className="icon-btn">🖼️</button>
            <button className="icon-btn">😊</button>
            <button className="icon-btn">🎥</button>
            <button className="btn btn-primary" onClick={handleCreatePost}>
              Опубликовать
            </button>
          </div>
        </div>

        {/* POSTS */}
        <div className="posts-list">
          {posts.map(post => (
            <div key={post.id} className="post-card">
              <div className="post-header">
                <div className="post-author">
                  <span className="avatar">{post.users.avatar_url}</span>
                  <div className="author-info">
                    <h4>{post.users.full_name}</h4>
                    <p>@{post.users.username}</p>
                  </div>
                </div>
                <button className="post-menu-btn">⋯</button>
              </div>

              <p className="post-content">{post.content}</p>

              {post.image_url && (
                <img src={post.image_url} alt="Post" className="post-image" />
              )}

              <div className="post-reactions">
                {EMOJI_REACTIONS.map(emoji => (
                  <button key={emoji} className="reaction-btn">
                    {emoji}
                  </button>
                ))}
              </div>

              <div className="post-stats">
                <span>❤️ 42 лайков</span>
                <span>💬 8 комментариев</span>
                <span>📤 3 поделились</span>
              </div>

              <button 
                className="toggle-comments-btn"
                onClick={() => toggleComments(post.id)}
              >
                {expandedComments[post.id] ? '🔽' : '▶'} Комментарии
              </button>

              {expandedComments[post.id] && (
                <div className="comments-section">
                  <div className="comments-list">
                    <div className="comment">
                      <span className="avatar">🧑‍🦰</span>
                      <div>
                        <p><strong>Иван Петров</strong></p>
                        <p className="comment-text">Супер пост! 🔥</p>
                      </div>
                    </div>
                  </div>
                  <form className="comment-form" onSubmit={(e) => e.preventDefault()}>
                    <input type="text" placeholder="Напишите комментарий..." />
                    <button className="icon-btn">😊</button>
                  </form>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============= MESSENGER PAGE =============
function MessengerPage({ user }) {
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([
    { id: 1, sender_id: 'user1', content: 'Привет! Как дела? 👋', created_at: new Date(Date.now() - 300000).toISOString() },
    { id: 2, sender_id: user.id, content: 'Привет! 😊 Всё хорошо!', created_at: new Date(Date.now() - 240000).toISOString() },
    { id: 3, sender_id: 'user1', content: 'А что нового?', created_at: new Date(Date.now() - 180000).toISOString() }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;

    const msg = {
      id: messages.length + 1,
      sender_id: user.id,
      recipient_id: selectedChat,
      content: newMessage,
      created_at: new Date().toISOString()
    };

    setMessages([...messages, msg]);
    setNewMessage('');
  };

  return (
    <div className="messenger-page">
      <div className="messenger-container">
        {/* CHATS LIST */}
        <div className="chats-sidebar">
          <div className="chats-header">
            <h2>💬 Чаты</h2>
            <button className="new-chat-btn">➕</button>
          </div>

          <div className="chats-list">
            {DEMO_USERS.map(u => (
              <div
                key={u.id}
                className={`chat-item ${selectedChat === u.id ? 'active' : ''}`}
                onClick={() => setSelectedChat(u.id)}
              >
                <div className="chat-avatar">{u.avatar_url}</div>
                <div className="chat-info">
                  <h4>{u.full_name}</h4>
                  <p>@{u.username}</p>
                  <span className="online-dot" data-status={u.online_status}></span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CHAT WINDOW */}
        <div className="chat-window">
          {selectedChat ? (
            <>
              <div className="chat-header">
                <div className="chat-title">
                  <h3>{DEMO_USERS.find(u => u.id === selectedChat)?.full_name}</h3>
                  <span className="status">🟢 онлайн</span>
                </div>
              </div>

              <div className="messages-list">
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`message ${msg.sender_id === user.id ? 'sent' : 'received'}`}
                  >
                    <p>{msg.content}</p>
                    <span className="message-time">
                      {new Date(msg.created_at).toLocaleTimeString('ru-RU', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                ))}
                {typingUsers.length > 0 && (
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="message-form">
                <button className="icon-btn">😊</button>
                <input
                  type="text"
                  placeholder="Сообщение..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onFocus={() => setTypingUsers(prev => {
                    if (!prev.includes(selectedChat)) {
                      return [...prev, selectedChat];
                    }
                    return prev;
                  })}
                  onBlur={() => setTypingUsers(prev => prev.filter(id => id !== selectedChat))}
                />
                <button type="submit" className="send-btn">📤</button>
              </form>
            </>
          ) : (
            <div className="empty-chat">
              <p>💬 Выбери контакт для чата</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============= EXPLORE PAGE =============
function ExplorePage({ user }) {
  const [search, setSearch] = useState('');
  const [followers, setFollowers] = useState({});

  const filteredUsers = DEMO_USERS.filter(u =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  const toggleFollow = (userId) => {
    setFollowers(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  return (
    <div className="explore-page">
      <div className="explore-container">
        <div className="explore-header">
          <h2>🔍 Поиск пользователей</h2>
          <input
            type="text"
            placeholder="Поиск по имени или логину..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="users-grid">
          {filteredUsers.length === 0 ? (
            <div className="empty">Ничего не найдено</div>
          ) : (
            filteredUsers.map(u => (
              <div key={u.id} className="user-card">
                <div className="user-card-header">
                  <div className="user-card-avatar">{u.avatar_url}</div>
                  <span className="status-badge" data-status={u.online_status}></span>
                </div>
                <h3>{u.full_name}</h3>
                <p>@{u.username}</p>
                <p className="user-bio">{u.bio}</p>
                <div className="user-stats">
                  <span>245 подписчиков</span>
                  <span>128 подписок</span>
                </div>
                <button 
                  className={`follow-btn ${followers[u.id] ? 'following' : ''}`}
                  onClick={() => toggleFollow(u.id)}
                >
                  {followers[u.id] ? '✓ Подписан' : '+ Подписаться'}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ============= PROFILE PAGE =============
function ProfilePage({ user }) {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState(user);

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-cover"></div>
          <div className="profile-info">
            <div className="profile-avatar">{profile.avatar_url}</div>
            <div className="profile-details">
              <h1>{profile.full_name}</h1>
              <p>@{profile.username}</p>
              <p className="profile-bio">{profile.bio}</p>
              <div className="profile-stats">
                <div className="stat">
                  <span className="stat-number">42</span>
                  <span className="stat-label">Постов</span>
                </div>
                <div className="stat">
                  <span className="stat-number">234</span>
                  <span className="stat-label">Подписчиков</span>
                </div>
                <div className="stat">
                  <span className="stat-number">128</span>
                  <span className="stat-label">Подписок</span>
                </div>
              </div>
            </div>
            {!isEditing && (
              <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
                ✏️ Редактировать
              </button>
            )}
          </div>
        </div>

        {isEditing && (
          <div className="profile-edit">
            <h2>Редактировать профиль</h2>
            <div className="edit-form">
              <input 
                type="text" 
                value={profile.full_name}
                onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                placeholder="Имя"
              />
              <textarea
                value={profile.bio}
                onChange={(e) => setProfile({...profile, bio: e.target.value})}
                placeholder="Биография"
              ></textarea>
              <div className="edit-buttons">
                <button className="btn btn-primary" onClick={() => setIsEditing(false)}>
                  ✓ Сохранить
                </button>
                <button className="btn btn-secondary" onClick={() => {
                  setProfile(user);
                  setIsEditing(false);
                }}>
                  ✕ Отмена
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="profile-posts">
          <h2>Мои посты</h2>
          {/* Posts from this user */}
        </div>
      </div>
    </div>
  );
}

// ============= ADMIN PANEL =============
function AdminPanel({ user }) {
  const [stats] = useState({
    users: DEMO_USERS.length,
    messages: 15,
    posts: 42,
    reports: 3
  });
  const [emailKeys, setEmailKeys] = useState([
    { id: 1, key_name: 'SendGrid API', service_type: 'sendgrid', is_active: true }
  ]);
  const [newKey, setNewKey] = useState({ name: '', value: '', type: 'smtp' });

  const handleAddKey = (e) => {
    e.preventDefault();
    if (!newKey.name || !newKey.value) return;

    setEmailKeys([...emailKeys, {
      id: emailKeys.length + 1,
      key_name: newKey.name,
      service_type: newKey.type,
      is_active: true
    }]);
    setNewKey({ name: '', value: '', type: 'smtp' });
  };

  const handleDeleteKey = (id) => {
    setEmailKeys(emailKeys.filter(k => k.id !== id));
  };

  return (
    <div className="admin-page">
      <div className="admin-container">
        <h1>⚙️ Админ Панель</h1>

        <div className="stats-grid">
          <div className="stat-card">
            <h3>👥 Пользователей</h3>
            <p className="stat-number">{stats.users}</p>
          </div>
          <div className="stat-card">
            <h3>💬 Сообщений</h3>
            <p className="stat-number">{stats.messages}</p>
          </div>
          <div className="stat-card">
            <h3>📝 Постов</h3>
            <p className="stat-number">{stats.posts}</p>
          </div>
          <div className="stat-card alert">
            <h3>⚠️ Жалоб</h3>
            <p className="stat-number">{stats.reports}</p>
          </div>
        </div>

        <div className="admin-section">
          <h2>🔑 Управление ключами почты</h2>
          
          <form onSubmit={handleAddKey} className="key-form">
            <input
              type="text"
              placeholder="Название ключа"
              value={newKey.name}
              onChange={(e) => setNewKey({...newKey, name: e.target.value})}
            />
            <select value={newKey.type} onChange={(e) => setNewKey({...newKey, type: e.target.value})}>
              <option value="smtp">SMTP</option>
              <option value="sendgrid">SendGrid</option>
              <option value="mailgun">Mailgun</option>
            </select>
            <input
              type="password"
              placeholder="API ключ"
              value={newKey.value}
              onChange={(e) => setNewKey({...newKey, value: e.target.value})}
            />
            <button type="submit" className="btn btn-primary">Добавить</button>
          </form>

          <div className="keys-list">
            {emailKeys.map(key => (
              <div key={key.id} className="key-item">
                <div>
                  <h4>{key.key_name}</h4>
                  <span>{key.service_type.toUpperCase()}</span>
                </div>
                <button className="delete-btn" onClick={() => handleDeleteKey(key.id)}>
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-section">
          <h2>🚨 Модерация контента</h2>
          <div className="moderation-list">
            <p>Нет жалоб</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============= ADMIN STATS PAGE =============
function AdminStats({ user }) {
  const [period, setPeriod] = useState('week');

  return (
    <div className="admin-page">
      <div className="admin-container">
        <h1>📊 Статистика системы</h1>

        <div className="period-selector">
          <button className={`period-btn ${period === 'day' ? 'active' : ''}`} onClick={() => setPeriod('day')}>
            День
          </button>
          <button className={`period-btn ${period === 'week' ? 'active' : ''}`} onClick={() => setPeriod('week')}>
            Неделя
          </button>
          <button className={`period-btn ${period === 'month' ? 'active' : ''}`} onClick={() => setPeriod('month')}>
            Месяц
          </button>
        </div>

        <div className="stats-cards">
          <div className="stat-card-large">
            <h3>Активные пользователи</h3>
            <p className="large-number">156</p>
            <p className="trend">↑ 12% от прошлого периода</p>
          </div>
          <div className="stat-card-large">
            <h3>Новых сообщений</h3>
            <p className="large-number">2,845</p>
            <p className="trend">↑ 8% от прошлого периода</p>
          </div>
          <div className="stat-card-large">
            <h3>Новых постов</h3>
            <p className="large-number">421</p>
            <p className="trend">↓ 5% от прошлого периода</p>
          </div>
        </div>

        <div className="chart-container">
          <h2>📈 Активность за период</h2>
          <div className="simple-chart">
            <div className="chart-bar" style={{height: '30%'}}></div>
            <div className="chart-bar" style={{height: '45%'}}></div>
            <div className="chart-bar" style={{height: '60%'}}></div>
            <div className="chart-bar" style={{height: '75%'}}></div>
            <div className="chart-bar" style={{height: '85%'}}></div>
            <div className="chart-bar" style={{height: '70%'}}></div>
            <div className="chart-bar" style={{height: '90%'}}></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============= LOADING SCREEN =============
function LoadingScreen() {
  return (
    <div className="app-loader">
      <div className="loader-content">
        <div className="loader-emoji">🐗</div>
        <h1>KabanChat</h1>
        <p>Загружается...</p>
        <div className="spinner"></div>
      </div>
    </div>
  );
}

export default App;
