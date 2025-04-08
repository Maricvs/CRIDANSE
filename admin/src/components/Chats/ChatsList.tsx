import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  IconButton,
  Tooltip,
  CircularProgress,
  Button,
  Card,
  CardContent,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  MdRefresh as RefreshIcon,
  MdSearch as SearchIcon,
  MdDelete as DeleteIcon,
  MdVisibility as ViewIcon,
  MdChat as ChatIcon,
  MdFileDownload as DownloadIcon,
} from 'react-icons/md';
import { SelectChangeEvent } from '@mui/material/Select';

// Интерфейс для чата
interface Chat {
  id: number;
  title: string;
  userId: number;
  userName: string;
  userAvatar?: string;
  messageCount: number;
  lastMessageDate: string;
  isActive: boolean;
}

// Интерфейс для сообщения
interface Message {
  id: number;
  chatId: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const ChatsList: React.FC = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [filteredChats, setFilteredChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [chatDialogOpen, setChatDialogOpen] = useState(false);

  // Статистика
  const [stats, setStats] = useState({
    totalChats: 0,
    activeChats: 0,
    totalMessages: 0,
    averageMessagesPerChat: 0,
  });

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {
    filterChats();
  }, [chats, searchText, statusFilter]);

  const fetchChats = async () => {
    setLoading(true);
    try {
      // Имитация запроса к API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Моковые данные
      const mockChats: Chat[] = Array.from({ length: 30 }, (_, i) => {
        const isActive = Math.random() > 0.2;
        const messageCount = Math.floor(Math.random() * 50) + 1;
        
        const date = new Date();
        date.setHours(date.getHours() - Math.floor(Math.random() * 72));
        
        return {
          id: i + 1,
          title: `Чат ${i + 1}: ${['О работе с AI', 'Вопросы по программированию', 'Маркетинговые стратегии', 'Анализ данных', 'Общие вопросы'][Math.floor(Math.random() * 5)]}`,
          userId: Math.floor(Math.random() * 10) + 1,
          userName: ['Иван Петров', 'Анна Смирнова', 'Сергей Иванов', 'Екатерина Козлова', 'Алексей Николаев'][Math.floor(Math.random() * 5)],
          userAvatar: Math.random() > 0.3 ? `https://randomuser.me/api/portraits/${Math.random() > 0.5 ? 'men' : 'women'}/${Math.floor(Math.random() * 50) + 1}.jpg` : undefined,
          messageCount,
          lastMessageDate: date.toISOString(),
          isActive,
        };
      });
      
      setChats(mockChats);
      
      // Обновляем статистику
      const activeChats = mockChats.filter(chat => chat.isActive).length;
      const totalMessages = mockChats.reduce((sum, chat) => sum + chat.messageCount, 0);
      
      setStats({
        totalChats: mockChats.length,
        activeChats,
        totalMessages,
        averageMessagesPerChat: Math.round(totalMessages / mockChats.length),
      });
      
    } catch (error) {
      console.error('Ошибка при загрузке чатов:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (chatId: number) => {
    setMessagesLoading(true);
    try {
      // Имитация запроса к API
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Моковые данные сообщений
      const messageCount = Math.floor(Math.random() * 20) + 5;
      const mockMessages: Message[] = Array.from({ length: messageCount }, (_, i) => {
        const isUser = i % 2 === 0;
        const date = new Date();
        date.setMinutes(date.getMinutes() - (messageCount - i) * 2);
        
        let content = '';
        if (isUser) {
          content = sample([
            'Можешь объяснить, как работает этот алгоритм?',
            'Что ты знаешь о машинном обучении?',
            'Как мне оптимизировать мой код?',
            'Расскажи о последних трендах в AI',
            'Какие есть лучшие практики для разработки веб-приложений?',
          ]);
        } else {
          content = sample([
            'Конечно! Этот алгоритм работает по принципу...',
            'Машинное обучение - это область искусственного интеллекта, которая...',
            'Для оптимизации кода вы можете использовать следующие подходы...',
            'Последние тренды в AI включают развитие больших языковых моделей...',
            'При разработке веб-приложений рекомендуется следовать принципам...',
          ]);
        }
        
        return {
          id: i + 1,
          chatId,
          role: isUser ? 'user' : 'assistant',
          content,
          timestamp: date.toISOString(),
        };
      });
      
      setMessages(mockMessages);
    } catch (error) {
      console.error('Ошибка при загрузке сообщений:', error);
    } finally {
      setMessagesLoading(false);
    }
  };

  const sample = <T,>(array: T[]): T => {
    return array[Math.floor(Math.random() * array.length)];
  };

  const filterChats = () => {
    let filtered = [...chats];
    
    if (searchText) {
      const lowerCaseSearch = searchText.toLowerCase();
      filtered = filtered.filter(chat => 
        chat.title.toLowerCase().includes(lowerCaseSearch) ||
        chat.userName.toLowerCase().includes(lowerCaseSearch)
      );
    }
    
    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active';
      filtered = filtered.filter(chat => chat.isActive === isActive);
    }
    
    setFilteredChats(filtered);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(event.target.value);
  };

  const handleStatusFilterChange = (event: SelectChangeEvent<string>) => {
    setStatusFilter(event.target.value);
  };

  const handleResetFilters = () => {
    setSearchText('');
    setStatusFilter('all');
  };

  const handleRefresh = () => {
    fetchChats();
  };

  const handleViewChat = (chat: Chat) => {
    setSelectedChat(chat);
    fetchMessages(chat.id);
    setChatDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setChatDialogOpen(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Box style={{ padding: '16px' }}>
      <Box style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px' 
      }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Чаты
        </Typography>
        <Box style={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title="Обновить список">
            <IconButton onClick={handleRefresh} color="primary" style={{ marginRight: '8px' }}>
              <RefreshIcon size="1.5em" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Экспорт чатов">
            <IconButton color="primary">
              <DownloadIcon size="1.5em" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Grid container spacing={3} style={{ marginBottom: '24px' }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent style={{ textAlign: 'center' }}>
              <ChatIcon size="1.5em" style={{ marginBottom: 8, color: 'primary' }} />
              <Typography variant="h4">{stats.totalChats}</Typography>
              <Typography variant="body2" color="textSecondary">Всего чатов</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent style={{ textAlign: 'center' }}>
              <ChatIcon size="1.5em" style={{ marginBottom: 8, color: '#4caf50' }} />
              <Typography variant="h4">{stats.activeChats}</Typography>
              <Typography variant="body2" color="textSecondary">Активных чатов</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent style={{ textAlign: 'center' }}>
              <ChatIcon size="1.5em" style={{ marginBottom: 8, color: '#9c27b0' }} />
              <Typography variant="h4">{stats.totalMessages}</Typography>
              <Typography variant="body2" color="textSecondary">Всего сообщений</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent style={{ textAlign: 'center' }}>
              <ChatIcon size="1.5em" style={{ marginBottom: 8, color: '#ff9800' }} />
              <Typography variant="h4">{stats.averageMessagesPerChat}</Typography>
              <Typography variant="body2" color="textSecondary">Сообщений на чат</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper style={{ padding: '16px', marginBottom: '24px' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={5}>
            <TextField
              fullWidth
              placeholder="Поиск по названию или имени пользователя..."
              variant="outlined"
              size="small"
              value={searchText}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: <SearchIcon size="1.5em" style={{ marginRight: 8, color: 'inherit' }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={5}>
            <FormControl fullWidth size="small">
              <InputLabel>Статус чата</InputLabel>
              <Select
                value={statusFilter}
                label="Статус чата"
                onChange={handleStatusFilterChange}
              >
                <MenuItem value="all">Все чаты</MenuItem>
                <MenuItem value="active">Активные</MenuItem>
                <MenuItem value="inactive">Неактивные</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<RefreshIcon size="1.5em" />}
              onClick={handleResetFilters}
            >
              Сбросить
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Typography variant="subtitle1" style={{ marginBottom: '16px' }}>
        Найдено: {filteredChats.length} чатов
      </Typography>

      <Paper style={{ width: '100%', overflow: 'hidden' }}>
        {loading ? (
          <Box style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer style={{ maxHeight: 600 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Название</TableCell>
                  <TableCell>Пользователь</TableCell>
                  <TableCell>Сообщений</TableCell>
                  <TableCell>Последнее сообщение</TableCell>
                  <TableCell>Статус</TableCell>
                  <TableCell>Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredChats.map((chat) => (
                  <TableRow key={chat.id} hover>
                    <TableCell>{chat.id}</TableCell>
                    <TableCell>{chat.title}</TableCell>
                    <TableCell>
                      <Box style={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar
                          src={chat.userAvatar}
                          alt={chat.userName}
                          style={{ width: 30, height: 30, marginRight: '8px' }}
                        />
                        {chat.userName}
                      </Box>
                    </TableCell>
                    <TableCell>{chat.messageCount}</TableCell>
                    <TableCell>{formatDate(chat.lastMessageDate)}</TableCell>
                    <TableCell>
                      <Chip
                        label={chat.isActive ? 'Активен' : 'Неактивен'}
                        color={chat.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Просмотреть чат">
                        <IconButton
                          color="primary"
                          size="small"
                          onClick={() => handleViewChat(chat)}
                        >
                          <ViewIcon size="1.5em" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Удалить чат">
                        <IconButton
                          color="error"
                          size="small"
                        >
                          <DeleteIcon size="1.5em" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Диалог для просмотра чата */}
      <Dialog
        open={chatDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        {selectedChat && (
          <>
            <DialogTitle>
              <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6">
                  {selectedChat.title} (ID: {selectedChat.id})
                </Typography>
                <Chip
                  label={selectedChat.isActive ? 'Активен' : 'Неактивен'}
                  color={selectedChat.isActive ? 'success' : 'default'}
                  size="small"
                />
              </Box>
              <Typography variant="body2" color="textSecondary">
                Пользователь: {selectedChat.userName} (ID: {selectedChat.userId})
              </Typography>
            </DialogTitle>
            <DialogContent dividers>
              {messagesLoading ? (
                <Box style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Box style={{ maxHeight: 400, overflow: 'auto' }}>
                  {messages.map((message) => (
                    <Box
                      key={message.id}
                      style={{
                        display: 'flex',
                        flexDirection: message.role === 'user' ? 'row' : 'row-reverse',
                        marginBottom: '16px',
                      }}
                    >
                      <Avatar
                        style={{
                          backgroundColor: message.role === 'user' ? 'primary.main' : 'secondary.main',
                          marginRight: message.role === 'user' ? '8px' : 0,
                          marginLeft: message.role === 'assistant' ? '8px' : 0,
                        }}
                      >
                        {message.role === 'user' ? 'U' : 'AI'}
                      </Avatar>
                      <Paper
                        variant="outlined"
                        style={{
                          padding: '16px',
                          maxWidth: '70%',
                          borderRadius: '8px',
                          backgroundColor: message.role === 'user' ? 'background.default' : 'primary.light',
                        }}
                      >
                        <Typography variant="body1">{message.content}</Typography>
                        <Typography variant="caption" color="textSecondary" style={{ display: 'block', marginTop: '8px' }}>
                          {formatDate(message.timestamp)}
                        </Typography>
                      </Paper>
                    </Box>
                  ))}
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Закрыть</Button>
              <Button color="primary" startIcon={<DownloadIcon size="1.5em" />}>
                Экспорт чата
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default ChatsList; 