import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// ============= SUPABASE КОНФИГУРАЦИЯ (ТОЛЬКО ОДИН РАЗ!) =============
const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';

let supabase = null;

const initSupabase = async () => {
  if (!supabase) {
    const { createClient } = await import('@supabase/supabase-js');
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabase;
};

// ============= ПРИЛОЖЕНИЕ =============
function App() {
  const [page, setPage] = useState('auth');
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const sb = await initSupabase();
      const stored = localStorage.getItem('user');
      if (stored) {
        const user = JSON.parse(stored);
        setCurrentUser(user);
        setPage(user.username === 'admin' ? 'admin' : 'feed');
        setIsAdmin(user.username === 'admin');
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  if (loading) {
    return <div className="loader">🐗 KabanChat загружается...</div>;
  }

  return (
    <div className="app">
      {currentUser && (
        <nav className="navbar">
          <div className="navbar-left">
            <h1 className="logo">🐗 KabanChat</h1>
            {!isAdmin && (
              <>
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
              </>
            )}
            {isAdmin && (
              <button 
                className={`nav-btn ${page === 'admin' ? 'active' : ''}`}
                onClick={() => setPage('admin')}
              >
                ⚙️ Админ Панель
              </button>
            )}
          </div>
          <div className="navbar-right">
            <span className="user-name">👤 {currentUser.full_name}</span>
            <button 
              className="logout-btn"
              onClick={() => {
                localStorage.removeItem('user');
                setCurrentUser(null);
                setPage('auth');
              }}
            >
              Выход
            </button>
          </div>
        </nav>
      )}

      {!currentUser ? (
        <AuthPage onAuth={(user) => {
          setCurrentUser(user);
          setIsAdmin(user.username === 'admin');
          setPage(user.username === 'admin' ? 'admin' : 'feed');
        }} />
      ) : isAdmin ? (
        <AdminPanel user={currentUser} />
      ) : page === 'feed' ? (
        <FeedPage user={currentUser} />
      ) : (
        <MessengerPage user={currentUser} />
      )}
    </div>
  );
}

// ============= AUTH PAGE =============
function AuthPage({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [formData, setFormData] = useState({
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
        // Проверка админа
        if (formData.username === 'admin' && formData.password === '123') {
          const adminUser = {
            id: 'admin-id',
            username: 'admin',
            full_name: 'Администратор',
            email: 'admin@kaban.chat'
          };
          localStorage.setItem('user', JSON.stringify(adminUser));
          onAuth(adminUser);
          return;
        }

        // Обычный логин
        const { data, error: err } = await sb
          .from('users')
          .select('*')
          .eq('username', formData.username)
          .single();

        if (err || !data) {
          setError('Пользователь не найден');
          setLoading(false);
          return;
        }

        // Простая проверка пароля (в реальном приложении используй bcrypt!)
        if (data.password_hash !== formData.password) {
          setError('Неверный пароль');
          setLoading(false);
          return;
        }

        localStorage.setItem('user', JSON.stringify(data));
        onAuth(data);
      } else {
        // Регистрация
        if (formData.password !== formData.confirmPassword) {
          setError('Пароли не совпадают');
          setLoading(false);
          return;
        }

        const { data, error: err } = await sb
          .from('users')
          .insert([{
            email: formData.email,
            username: formData.username,
            full_name: formData.fullName,
            password_hash: formData.password
          }])
          .select();

        if (err) {
          setError(err.message);
          setLoading(false);
          return;
        }

        const newUser = data[0];
        localStorage.setItem('user', JSON.stringify(newUser));
        onAuth(newUser);
      }
    } catch (err) {
      setError('Ошибка: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">🐗 KabanChat</h1>
        <p className="auth-subtitle">Социальный мессенджер нового поколения</p>

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
                placeholder="Электронная почта"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
              <input
                type="text"
                placeholder="Полное имя"
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                required
              />
            </>
          )}

          <input
            type="text"
            placeholder="Логин"
            value={formData.username}
            onChange={(e) => setFormData({...formData, username: e.target.value})}
            required
          />

          <input
            type="password"
            placeholder="Пароль"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
          />

          {mode === 'register' && (
            <input
              type="password"
              placeholder="Повторить пароль"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              required
            />
          )}

          {error && <div className="error">{error}</div>}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Загрузка...' : (mode === 'login' ? 'Вход' : 'Регистрация')}
          </button>
        </form>

        <div className="auth-footer">
          <p>📝 Демо: admin / 123</p>
        </div>
      </div>
    </div>
  );
}

// ============= FEED PAGE =============
function FeedPage({ user }) {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const sb = await initSupabase();
      const { data, error } = await sb
        .from('posts')
        .select('*, users(*)')
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error) {
        setPosts(data || []);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPost.trim()) return;

    try {
      const sb = await initSupabase();
      const { data, error } = await sb
        .from('posts')
        .insert([{
          user_id: user.id,
          content: newPost
        }])
        .select('*, users(*)');

      if (!error) {
        setPosts([data[0], ...posts]);
        setNewPost('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="feed-container">
      <div className="feed-header">
        <h2>📰 Лента новостей</h2>
        <form onSubmit={handleCreatePost} className="post-form">
          <textarea
            placeholder="Что нового? 🐗"
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            rows="3"
          />
          <button type="submit" className="post-btn">Опубликовать</button>
        </form>
      </div>

      <div className="posts-list">
        {loading ? (
          <div className="loader">Загрузка постов...</div>
        ) : posts.length === 0 ? (
          <div className="empty">Нет постов. Будь первым! 🐗</div>
        ) : (
          posts.map(post => (
            <div key={post.id} className="post-card">
              <div className="post-header">
                <div className="post-author">
                  <span className="avatar">👤</span>
                  <div>
                    <h3>{post.users.full_name}</h3>
                    <span className="username">@{post.users.username}</span>
                  </div>
                </div>
                <span className="post-time">{new Date(post.created_at).toLocaleDateString('ru-RU')}</span>
              </div>
              <p className="post-content">{post.content}</p>
              <div className="post-actions">
                <button className="action-btn">❤️ Нравится ({post.likes_count})</button>
                <button className="action-btn">💬 Комментировать</button>
                <button className="action-btn">➡️ Поделиться</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ============= MESSENGER PAGE =============
function MessengerPage({ user }) {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadChats();
    loadUsers();
  }, []);

  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat);
    }
  }, [selectedChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadChats = async () => {
    try {
      const sb = await initSupabase();
      const { data, error } = await sb
        .from('messages')
        .select('*, users(*)')
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (!error && data) {
        const chatMap = new Map();
        data.forEach(msg => {
          const otherId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id;
          if (!chatMap.has(otherId)) {
            chatMap.set(otherId, msg);
          }
        });
        setChats(Array.from(chatMap.values()));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadUsers = async () => {
    try {
      const sb = await initSupabase();
      const { data, error } = await sb
        .from('users')
        .select('*')
        .neq('id', user.id)
        .limit(20);

      if (!error) {
        setUsers(data || []);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const loadMessages = async (otherUserId) => {
    try {
      const sb = await initSupabase();
      const { data, error } = await sb
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (!error) {
        setMessages(data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;

    try {
      const sb = await initSupabase();
      const { data, error } = await sb
        .from('messages')
        .insert([{
          sender_id: user.id,
          recipient_id: selectedChat,
          content: newMessage
        }])
        .select();

      if (!error) {
        setMessages([...messages, data[0]]);
        setNewMessage('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="messenger-container">
      <div className="chats-sidebar">
        <h3>Чаты</h3>
        <div className="users-list">
          {users.map(u => (
            <div
              key={u.id}
              className={`user-item ${selectedChat === u.id ? 'active' : ''}`}
              onClick={() => setSelectedChat(u.id)}
            >
              <span className="avatar">👤</span>
              <div className="user-info">
                <h4>{u.full_name}</h4>
                <span>@{u.username}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="chat-window">
        {!selectedChat ? (
          <div className="empty-chat">
            <h2>💬 Выбери контакт для чата</h2>
          </div>
        ) : (
          <>
            <div className="messages-list">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`message ${msg.sender_id === user.id ? 'sent' : 'received'}`}
                >
                  <p>{msg.content}</p>
                  <span className="message-time">{new Date(msg.created_at).toLocaleTimeString('ru-RU')}</span>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="message-form">
              <input
                type="text"
                placeholder="Напиши сообщение..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <button type="submit" className="send-btn">➤</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// ============= ADMIN PANEL =============
function AdminPanel({ user }) {
  const [stats, setStats] = useState({ users: 0, messages: 0, posts: 0 });
  const [emailKeys, setEmailKeys] = useState([]);
  const [newKey, setNewKey] = useState({ name: '', value: '', type: 'smtp' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      const sb = await initSupabase();

      // Загрузить статистику
      const [usersRes, messagesRes, postsRes, keysRes] = await Promise.all([
        sb.from('users').select('id'),
        sb.from('messages').select('id'),
        sb.from('posts').select('id'),
        sb.from('email_keys').select('*')
      ]);

      setStats({
        users: usersRes.data?.length || 0,
        messages: messagesRes.data?.length || 0,
        posts: postsRes.data?.length || 0
      });

      setEmailKeys(keysRes.data || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleAddKey = async (e) => {
    e.preventDefault();
    try {
      const sb = await initSupabase();
      const { data, error } = await sb
        .from('email_keys')
        .insert([{
          key_name: newKey.name,
          key_value: newKey.value,
          service_type: newKey.type,
          updated_by: user.username
        }])
        .select();

      if (!error) {
        setEmailKeys([...emailKeys, data[0]]);
        setNewKey({ name: '', value: '', type: 'smtp' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteKey = async (keyId) => {
    try {
      const sb = await initSupabase();
      const { error } = await sb
        .from('email_keys')
        .delete()
        .eq('id', keyId);

      if (!error) {
        setEmailKeys(emailKeys.filter(k => k.id !== keyId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="admin-container">
      <h2>⚙️ Админ Панель</h2>

      {loading ? (
        <div className="loader">Загрузка данных...</div>
      ) : (
        <>
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
            <h3>🔑 Ключи для почты</h3>
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
                placeholder="Значение ключа"
                value={newKey.value}
                onChange={(e) => setNewKey({...newKey, value: e.target.value})}
              />
              <button type="submit">Добавить ключ</button>
            </form>

            <div className="keys-list">
              {emailKeys.map(key => (
                <div key={key.id} className="key-item">
                  <div>
                    <h4>{key.key_name}</h4>
                    <span>{key.service_type}</span>
                  </div>
                  <button 
                    className="delete-btn"
                    onClick={() => handleDeleteKey(key.id)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
