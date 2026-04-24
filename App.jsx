import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// ============= SUPABASE =============
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

// ============= ДЕФОЛТ ДЕМО ДАННЫЕ =============
const DEMO_USER = {
  id: 'demo-user',
  username: 'demo_user',
  full_name: 'Демо Пользователь',
  email: 'demo@test.com'
};

const DEMO_POSTS = [
  {
    id: 1,
    user_id: 'demo-user',
    content: '🐗 Привет! Это демо версия KabanChat',
    users: { full_name: 'Демо Пользователь', username: 'demo_user' },
    created_at: new Date().toISOString(),
    likes_count: 42
  },
  {
    id: 2,
    user_id: 'other-user',
    content: 'Мой первый пост в ленте 📝',
    users: { full_name: 'Другой Пользователь', username: 'other_user' },
    created_at: new Date(Date.now() - 3600000).toISOString(),
    likes_count: 15
  }
];

const DEMO_USERS = [
  { id: 'user1', full_name: 'Иван Петров', username: 'ivan_petrov', email: 'ivan@test.com' },
  { id: 'user2', full_name: 'Мария Сидорова', username: 'maria_sidor', email: 'maria@test.com' },
  { id: 'user3', full_name: 'Сергей Смирнов', username: 'sergey_smir', email: 'sergey@test.com' }
];

// ============= ГЛАВНОЕ ПРИЛОЖЕНИЕ =============
function App() {
  const [page, setPage] = useState('feed');
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      await initSupabase();
      const stored = localStorage.getItem('user');
      if (stored) {
        const user = JSON.parse(stored);
        setCurrentUser(user);
        setIsAdmin(user.username === 'kaban');
        setPage(user.username === 'kaban' ? 'admin' : 'feed');
      } else {
        // Если не логинен, используй демо пользователя
        setCurrentUser(DEMO_USER);
        setPage('feed');
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  if (loading) {
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

  const handleLogout = () => {
    localStorage.removeItem('user');
    setCurrentUser(DEMO_USER);
    setIsAdmin(false);
    setPage('feed');
  };

  return (
    <div className={`app ${darkMode ? 'dark' : 'light'}`}>
      {/* ===== NAVBAR ===== */}
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
                💬 Сообщения
              </button>
              <button 
                className={`nav-btn ${page === 'explore' ? 'active' : ''}`}
                onClick={() => setPage('explore')}
              >
                🔍 Поиск
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
          <button 
            className="theme-btn"
            onClick={() => setDarkMode(!darkMode)}
            title="Смена темы"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
          
          <div className="user-info">
            <span>👤 {currentUser?.full_name || 'Гость'}</span>
          </div>

          {currentUser?.username === DEMO_USER.username ? (
            <button 
              className="auth-btn login-btn"
              onClick={() => setPage('auth')}
            >
              Вход
            </button>
          ) : (
            <button 
              className="auth-btn logout-btn"
              onClick={handleLogout}
            >
              Выход
            </button>
          )}
        </div>
      </nav>

      {/* ===== КОНТЕНТ ===== */}
      <main className="main-content">
        {!currentUser ? (
          <AuthPage onAuth={(user) => {
            setCurrentUser(user);
            setIsAdmin(user.username === 'kaban');
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
        ) : (
          <FeedPage user={currentUser} />
        )}
      </main>
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const sb = await initSupabase();

      if (mode === 'login') {
        if (form.username === 'kaban' && form.password === '123') {
          const adminUser = {
            id: 'admin-id',
            username: 'kaban',
            full_name: 'Администратор',
            email: 'admin@kaban.chat'
          };
          localStorage.setItem('user', JSON.stringify(adminUser));
          onAuth(adminUser);
          return;
        }

        const { data, error: err } = await sb
          .from('users')
          .select('*')
          .eq('username', form.username)
          .single();

        if (err || !data) {
          setError('Пользователь не найден');
          setLoading(false);
          return;
        }

        if (data.password_hash !== form.password) {
          setError('Неверный пароль');
          setLoading(false);
          return;
        }

        localStorage.setItem('user', JSON.stringify(data));
        onAuth(data);
      } else {
        if (form.password !== form.confirmPassword) {
          setError('Пароли не совпадают');
          setLoading(false);
          return;
        }

        const { data, error: err } = await sb
          .from('users')
          .insert([{
            email: form.email,
            username: form.username,
            full_name: form.fullName,
            password_hash: form.password
          }])
          .select();

        if (err) {
          setError(err.message || 'Ошибка при регистрации');
          setLoading(false);
          return;
        }

        const newUser = data[0];
        localStorage.setItem('user', JSON.stringify(newUser));
        onAuth(newUser);
      }
    } catch (err) {
      setError('Ошибка: ' + (err.message || 'Неизвестная ошибка'));
    }
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">🐗 KabanChat</h1>
        <p className="auth-subtitle">Мессенджер нового поколения</p>

        <div className="auth-tabs">
          <button 
            className={`tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => { setMode('login'); setError(''); }}
          >
            Вход
          </button>
          <button 
            className={`tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => { setMode('register'); setError(''); }}
          >
            Регистрация
          </button>
        </div>

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
                placeholder="Полное имя"
                value={form.fullName}
                onChange={(e) => setForm({...form, fullName: e.target.value})}
                required
              />
            </>
          )}

          <input
            type="text"
            placeholder="Логин"
            value={form.username}
            onChange={(e) => setForm({...form, username: e.target.value})}
            required
          />

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
              placeholder="Повторить пароль"
              value={form.confirmPassword}
              onChange={(e) => setForm({...form, confirmPassword: e.target.value})}
              required
            />
          )}

          {error && <div className="error">{error}</div>}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Загрузка...' : (mode === 'login' ? 'Вход' : 'Регистрация')}
          </button>
        </form>

        <div className="auth-footer">
          <p>📝 Демо: <strong>kaban / 123</strong></p>
          <p>✨ Или используй демо без регистрации</p>
        </div>
      </div>
    </div>
  );
}

// ============= FEED PAGE (ВК - ПОСТЫ) =============
function FeedPage({ user }) {
  const [posts, setPosts] = useState(DEMO_POSTS);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPost.trim()) return;

    const newPostObj = {
      id: posts.length + 1,
      user_id: user.id,
      content: newPost,
      users: { full_name: user.full_name, username: user.username },
      created_at: new Date().toISOString(),
      likes_count: 0
    };

    setPosts([newPostObj, ...posts]);
    setNewPost('');

    // Попробуем загрузить в Supabase
    try {
      const sb = await initSupabase();
      await sb
        .from('posts')
        .insert([{
          user_id: user.id,
          content: newPost
        }])
        .select('*, users(*)');
    } catch (err) {
      console.log('Demo mode - пост добавлен в UI');
    }
  };

  const handleLike = (postId) => {
    setPosts(posts.map(p => 
      p.id === postId 
        ? { ...p, likes_count: p.likes_count + 1 }
        : p
    ));
  };

  return (
    <div className="feed-page">
      <div className="feed-wrapper">
        {/* Левая колонка - статистика */}
        <div className="feed-sidebar">
          <div className="profile-card">
            <div className="profile-avatar">👤</div>
            <h3>{user.full_name}</h3>
            <p>@{user.username}</p>
            <div className="profile-stats">
              <div className="stat">
                <span className="stat-num">24</span>
                <span className="stat-label">Посты</span>
              </div>
              <div className="stat">
                <span className="stat-num">156</span>
                <span className="stat-label">Подписчики</span>
              </div>
            </div>
          </div>
        </div>

        {/* Центральная колонка - лента */}
        <div className="feed-main">
          <div className="feed-header">
            <h2>📰 Лента новостей</h2>
          </div>

          <form onSubmit={handleCreatePost} className="post-form">
            <div className="post-input-wrapper">
              <div className="post-avatar">👤</div>
              <textarea
                placeholder="Что новенького? 🐗"
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                rows="3"
              />
            </div>
            <button type="submit" className="post-btn">Опубликовать</button>
          </form>

          <div className="posts-list">
            {posts.length === 0 ? (
              <div className="empty">Нет постов. Будь первым! 🐗</div>
            ) : (
              posts.map(post => (
                <div key={post.id} className="post-card">
                  <div className="post-header">
                    <div className="post-author">
                      <span className="avatar">👤</span>
                      <div>
                        <h4>{post.users?.full_name || 'Неизвестный'}</h4>
                        <span className="username">@{post.users?.username || 'unknown'}</span>
                      </div>
                    </div>
                    <span className="post-time">
                      {new Date(post.created_at).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                  
                  <p className="post-content">{post.content}</p>
                  
                  <div className="post-actions">
                    <button className="action-btn" onClick={() => handleLike(post.id)}>
                      ❤️ Нравится ({post.likes_count})
                    </button>
                    <button className="action-btn">💬 Комментировать</button>
                    <button className="action-btn">➡️ Поделиться</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Правая колонка - рекомендации */}
        <div className="feed-sidebar right">
          <div className="recommendations">
            <h3>👥 Рекомендации</h3>
            {DEMO_USERS.map(u => (
              <div key={u.id} className="recommend-user">
                <div>
                  <p className="user-name">{u.full_name}</p>
                  <p className="user-handle">@{u.username}</p>
                </div>
                <button className="follow-btn">Подписаться</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============= MESSENGER PAGE (TELEGRAM - ЧАТЫ) =============
function MessengerPage({ user }) {
  const [selectedChat, setSelectedChat] = useState(DEMO_USERS[0]?.id || null);
  const [messages, setMessages] = useState([
    { id: 1, sender_id: DEMO_USERS[0]?.id, content: 'Привет! 👋', created_at: new Date(Date.now() - 3600000).toISOString() },
    { id: 2, sender_id: user.id, content: 'Привет! Как дела?', created_at: new Date(Date.now() - 1800000).toISOString() },
    { id: 3, sender_id: DEMO_USERS[0]?.id, content: 'Всё хорошо! А у тебя?', created_at: new Date(Date.now() - 900000).toISOString() }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const msg = {
      id: messages.length + 1,
      sender_id: user.id,
      content: newMessage,
      created_at: new Date().toISOString()
    };

    setMessages([...messages, msg]);
    setNewMessage('');
  };

  return (
    <div className="messenger-page">
      <div className="chats-container">
        {/* Список чатов слева */}
        <div className="chats-sidebar">
          <div className="chats-header">
            <h2>💬 Сообщения</h2>
            <button className="new-chat-btn">➕</button>
          </div>

          <div className="chats-list">
            {DEMO_USERS.map(u => (
              <div
                key={u.id}
                className={`chat-item ${selectedChat === u.id ? 'active' : ''}`}
                onClick={() => setSelectedChat(u.id)}
              >
                <div className="chat-avatar">👤</div>
                <div className="chat-info">
                  <h4>{u.full_name}</h4>
                  <p>@{u.username}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Окно чата справа */}
        <div className="chat-window">
          {selectedChat ? (
            <>
              <div className="chat-header">
                <div className="chat-title">
                  <h3>{DEMO_USERS.find(u => u.id === selectedChat)?.full_name}</h3>
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
                      {new Date(msg.created_at).toLocaleTimeString('ru-RU')}
                    </span>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="message-form">
                <input
                  type="text"
                  placeholder="Сообщение..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button type="submit" className="send-btn">➤</button>
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

// ============= EXPLORE PAGE (ПОИСК) =============
function ExplorePage({ user }) {
  const [search, setSearch] = useState('');

  const filteredUsers = DEMO_USERS.filter(u =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase())
  );

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
                <div className="user-card-avatar">👤</div>
                <h3>{u.full_name}</h3>
                <p>@{u.username}</p>
                <button className="follow-btn">Подписаться</button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ============= ADMIN PANEL =============
function AdminPanel({ user }) {
  const [stats, setStats] = useState({
    users: 3,
    messages: 15,
    posts: 8
  });
  const [emailKeys, setEmailKeys] = useState([
    { id: 1, key_name: 'SendGrid API', service_type: 'sendgrid' }
  ]);
  const [newKey, setNewKey] = useState({ name: '', value: '', type: 'smtp' });

  const handleAddKey = (e) => {
    e.preventDefault();
    if (!newKey.name || !newKey.value) return;

    setEmailKeys([...emailKeys, {
      id: emailKeys.length + 1,
      key_name: newKey.name,
      service_type: newKey.type
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
            <button type="submit">Добавить</button>
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

export default App;
