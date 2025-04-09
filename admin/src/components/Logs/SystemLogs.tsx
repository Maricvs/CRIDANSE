import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
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
  TableSortLabel,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material';
import {
  MdRefresh as RefreshIcon,
  MdSearch as SearchIcon,
  MdDeleteSweep as ClearIcon,
  MdFileDownload as DownloadIcon,
  MdInfo as InfoIcon,
  MdDelete as DeleteIcon,
} from 'react-icons/md';

// Интерфейс для лого
interface LogEntry {
  id: number;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  source: string;
  message: string;
  details?: string;
}

type Order = 'asc' | 'desc';

const SystemLogs: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [logLevelFilter, setLogLevelFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [orderBy, setOrderBy] = useState<keyof LogEntry>('timestamp');
  const [order, setOrder] = useState<Order>('desc');

  // Получение логов при монтировании компонента
  useEffect(() => {
    fetchLogs();
  }, []);

  // Фильтрация логов при изменении поисковой строки или фильтров
  useEffect(() => {
    filterLogs();
  }, [logs, searchText, logLevelFilter, sourceFilter, orderBy, order]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/logs/logs?level=${logLevelFilter}&source=${sourceFilter}&search=${searchText}`);
      if (!response.ok) {
        throw new Error('Failed to fetch logs');
      }
      const data = await response.json();
      setLogs(data);
      setFilteredLogs(data);
    } catch (error) {
      console.error('Error fetching logs:', error);
      // В реальном приложении здесь можно добавить уведомление об ошибке
    } finally {
      setLoading(false);
    }
  };

  const sample = <T,>(array: T[]): T => {
    return array[Math.floor(Math.random() * array.length)];
  };

  const handleDownloadLogs = async () => {
    try {
      // Форматируем логи для скачивания
      const logsToDownload = filteredLogs.map(log => ({
        ...log,
        timestamp: formatTimestamp(log.timestamp)
      }));

      // Генерируем имя файла с текущей датой
      const prefixes = ['system', 'app', 'server'];
      const date = new Date().toISOString().split('T')[0];
      const randomPrefix = sample(prefixes);
      const fileName = `${randomPrefix}-logs-${date}.json`;

      // Создаем и скачиваем файл
      const blob = new Blob([JSON.stringify(logsToDownload, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading logs:', error);
      alert('Ошибка при скачивании логов');
    }
  };

  const handleRequestSort = (property: keyof LogEntry) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortLogs = (logs: LogEntry[]) => {
    return [...logs].sort((a, b) => {
      if (orderBy === 'timestamp') {
        return order === 'desc' 
          ? new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          : new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      }
      
      const aValue = a[orderBy] || '';
      const bValue = b[orderBy] || '';
      
      if (order === 'desc') {
        return String(bValue).localeCompare(String(aValue));
      }
      return String(aValue).localeCompare(String(bValue));
    });
  };

  const filterLogs = () => {
    let filtered = [...logs];
    
    // Фильтр по тексту
    if (searchText) {
      const lowerCaseSearch = searchText.toLowerCase();
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(lowerCaseSearch) ||
        log.details?.toLowerCase().includes(lowerCaseSearch) ||
        log.source.toLowerCase().includes(lowerCaseSearch)
      );
    }
    
    // Фильтр по уровню лога
    if (logLevelFilter !== 'all') {
      filtered = filtered.filter(log => log.level === logLevelFilter);
    }
    
    // Фильтр по источнику
    if (sourceFilter !== 'all') {
      filtered = filtered.filter(log => log.source === sourceFilter);
    }
    
    // Сортировка
    filtered = sortLogs(filtered);
    
    setFilteredLogs(filtered);
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    // Применяем фильтры в зависимости от выбранной вкладки
    switch(newValue) {
      case 0: // Все логи
        setLogLevelFilter('all');
        setSourceFilter('all');
        break;
      case 1: // Системные
        setSourceFilter('system');
        break;
      case 2: // Ошибки
        setLogLevelFilter('error');
        break;
      case 3: // API
        setSourceFilter('api');
        break;
      case 4: // База данных
        setSourceFilter('database');
        break;
    }
  };

  const handleRefresh = () => {
    fetchLogs();
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(event.target.value);
  };

  const handleLogLevelFilterChange = (event: SelectChangeEvent<string>) => {
    setLogLevelFilter(event.target.value);
  };

  const handleSourceFilterChange = (event: SelectChangeEvent<string>) => {
    setSourceFilter(event.target.value);
  };

  const handleResetFilters = () => {
    setSearchText('');
    setLogLevelFilter('all');
    setSourceFilter('all');
  };

  const handleLogClick = (log: LogEntry) => {
    setSelectedLog(log);
  };

  const handleCloseDetails = () => {
    setSelectedLog(null);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'info': return 'info';
      case 'warning': return 'warning';
      case 'error': return 'error';
      case 'debug': return 'default';
      default: return 'default';
    }
  };

  // Получаем уникальные источники из логов
  const sources = ['all', ...Array.from(new Set(logs.map(log => log.source)))];

  const handleDeleteLog = async (id: number) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот лог?')) {
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/logs/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete log');
      }
      
      // Обновляем список логов после успешного удаления
      setLogs(logs.filter(log => log.id !== id));
      setFilteredLogs(filteredLogs.filter(log => log.id !== id));
      setSelectedLog(null);
    } catch (error) {
      console.error('Error deleting log:', error);
      alert('Ошибка при удалении лога');
    }
  };

  return (
    <Box style={{ padding: '16px' }}>
      <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Системные логи
        </Typography>
        <Box style={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title="Обновить логи">
            <IconButton onClick={handleRefresh} color="primary" style={{ marginRight: '8px' }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Скачать логи">
            <IconButton 
              color="primary" 
              style={{ marginRight: '8px' }}
              onClick={handleDownloadLogs}
            >
              <DownloadIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Paper style={{ marginBottom: '24px' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Все логи" />
          <Tab label="Системные" />
          <Tab label="Ошибки" />
          <Tab label="API" />
          <Tab label="База данных" />
        </Tabs>
      </Paper>

      <Paper style={{ padding: '16px', marginBottom: '24px' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              placeholder="Поиск по логам..."
              variant="outlined"
              size="small"
              value={searchText}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: <SearchIcon style={{ marginRight: '8px', color: 'text.secondary' }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Уровень лога</InputLabel>
              <Select
                value={logLevelFilter}
                label="Уровень лога"
                onChange={handleLogLevelFilterChange}
              >
                <MenuItem value="all">Все уровни</MenuItem>
                <MenuItem value="info">Информация</MenuItem>
                <MenuItem value="warning">Предупреждение</MenuItem>
                <MenuItem value="error">Ошибка</MenuItem>
                <MenuItem value="debug">Отладка</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Источник</InputLabel>
              <Select
                value={sourceFilter}
                label="Источник"
                onChange={handleSourceFilterChange}
              >
                {sources.map(source => (
                  <MenuItem key={source} value={source}>
                    {source === 'all' ? 'Все источники' : source}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={handleResetFilters}
            >
              Сбросить
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Box style={{ display: 'flex', marginBottom: '16px' }}>
        <Typography variant="subtitle1">
          Найдено: {filteredLogs.length} записей
        </Typography>
      </Box>

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
                  <TableCell width={180}>
                    <TableSortLabel
                      active={orderBy === 'timestamp'}
                      direction={orderBy === 'timestamp' ? order : 'asc'}
                      onClick={() => handleRequestSort('timestamp')}
                    >
                      Время
                    </TableSortLabel>
                  </TableCell>
                  <TableCell width={100}>
                    <TableSortLabel
                      active={orderBy === 'level'}
                      direction={orderBy === 'level' ? order : 'asc'}
                      onClick={() => handleRequestSort('level')}
                    >
                      Уровень
                    </TableSortLabel>
                  </TableCell>
                  <TableCell width={120}>
                    <TableSortLabel
                      active={orderBy === 'source'}
                      direction={orderBy === 'source' ? order : 'asc'}
                      onClick={() => handleRequestSort('source')}
                    >
                      Источник
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'message'}
                      direction={orderBy === 'message' ? order : 'asc'}
                      onClick={() => handleRequestSort('message')}
                    >
                      Сообщение
                    </TableSortLabel>
                  </TableCell>
                  <TableCell width={100}>Детали</TableCell>
                  <TableCell width={100}>Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow
                    key={log.id}
                    hover
                    style={{ cursor: 'pointer' }}
                  >
                    <TableCell>{formatTimestamp(log.timestamp)}</TableCell>
                    <TableCell>
                      <Chip
                        label={log.level}
                        color={getLogLevelColor(log.level) as any}
                        size="small"
                        variant={log.level === 'debug' ? 'outlined' : 'filled'}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={log.source}
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{log.message}</TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleLogClick(log)}
                        color="primary"
                      >
                        <InfoIcon />
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteLog(log.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {selectedLog && (
        <Paper style={{ marginTop: '24px', padding: '24px' }}>
          <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <Typography variant="h6">Детали лога #{selectedLog.id}</Typography>
            <Box>
              <Button 
                variant="outlined" 
                color="error" 
                onClick={() => handleDeleteLog(selectedLog.id)}
                style={{ marginRight: '8px' }}
              >
                Удалить
              </Button>
              <Button variant="outlined" onClick={handleCloseDetails}>
                Закрыть
              </Button>
            </Box>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" color="textSecondary">Время</Typography>
              <Typography variant="body1">{formatTimestamp(selectedLog.timestamp)}</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" color="textSecondary">Уровень</Typography>
              <Typography variant="body1">
                <Chip
                  label={selectedLog.level}
                  color={getLogLevelColor(selectedLog.level) as any}
                  size="small"
                  variant={selectedLog.level === 'debug' ? 'outlined' : 'filled'}
                />
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" color="textSecondary">Источник</Typography>
              <Typography variant="body1">{selectedLog.source}</Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="caption" color="textSecondary">Сообщение</Typography>
              <Typography variant="body1">{selectedLog.message}</Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="caption" color="textSecondary">Детали</Typography>
              <Paper variant="outlined" style={{ padding: '16px', backgroundColor: 'background.default' }}>
                <Typography variant="body2" component="pre" style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                  {selectedLog.details}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Paper>
      )}
    </Box>
  );
};

export default SystemLogs;