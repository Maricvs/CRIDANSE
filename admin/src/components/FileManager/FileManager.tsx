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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableSortLabel,
  SelectChangeEvent,
} from '@mui/material';
import {
  MdRefresh as RefreshIcon,
  MdSearch as SearchIcon,
  MdDelete as DeleteIcon,
  MdVisibility as ViewIcon,
  MdFileUpload as UploadIcon,
  MdFileDownload as DownloadIcon,
  MdInsertDriveFile as FileIcon,
  MdPictureAsPdf as PdfIcon,
  MdInsertDriveFile as DocIcon,
  MdImage as ImageIcon,
  MdClose as CloseIcon,
  MdFolder as FolderIcon,
} from 'react-icons/md';
import axios from 'axios';
import { authService } from '../../services/auth';

// Интерфейс для файла
interface FileItem {
  id: number;
  name: string;
  path: string;
  size: number;
  type: string;
  created_at: string;
  updated_at: string;
  is_directory: boolean;
}

type Order = 'asc' | 'desc';

const FileManager: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState<string>('all');
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [orderBy, setOrderBy] = useState<keyof FileItem>('name');
  const [order, setOrder] = useState<Order>('asc');
  const [currentPath, setCurrentPath] = useState<string>('/');
  const [pathHistory, setPathHistory] = useState<string[]>(['/']);

  // Статистика
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalDirectories: 0,
    totalSize: 0,
  });

  useEffect(() => {
    fetchFiles();
    fetchStats();
  }, [currentPath]);

  useEffect(() => {
    filterFiles();
  }, [files, searchText, fileTypeFilter, orderBy, order]);

  const [error, setError] = useState<string | null>(null);

  const fetchFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = authService.getUser();
      if (!user?.id) {
        throw new Error('Пользователь не авторизован');
      }
      
      const response = await axios.get('/api/admin/files', {
        params: { 
          user_id: user.id,
          path: currentPath
        }
      });
      
      setFiles(response.data);
    } catch (error) {
      console.error('Ошибка при загрузке файлов:', error);
      if (axios.isAxiosError(error)) {
        console.log('Детали ошибки:', {
          status: error.response?.status,
          data: error.response?.data,
          headers: error.response?.headers
        });
      }
      setError('Не удалось загрузить файлы. Пожалуйста, попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const user = authService.getUser();
      const userId = user?.id;
      const response = await axios.get('/api/admin/files/stats', {
        params: { 
          user_id: userId,
          path: currentPath
        }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Ошибка при загрузке статистики:', error);
    }
  };

  const handleRequestSort = (property: keyof FileItem) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortFiles = (filesList: FileItem[]) => {
    return [...filesList].sort((a, b) => {
      // Сначала сортируем по типу (директории всегда вверху)
      if (a.is_directory !== b.is_directory) {
        return a.is_directory ? -1 : 1;
      }
      
      if (orderBy === 'created_at' || orderBy === 'updated_at') {
        return order === 'desc' 
          ? new Date(b[orderBy]).getTime() - new Date(a[orderBy]).getTime()
          : new Date(a[orderBy]).getTime() - new Date(b[orderBy]).getTime();
      }
      
      if (orderBy === 'size') {
        return order === 'desc' 
          ? b.size - a.size
          : a.size - b.size;
      }
      
      const aValue = a[orderBy] || '';
      const bValue = b[orderBy] || '';
      
      if (order === 'desc') {
        return String(bValue).localeCompare(String(aValue));
      }
      return String(aValue).localeCompare(String(bValue));
    });
  };

  const filterFiles = () => {
    let filtered = [...files];
    
    if (searchText) {
      const lowerCaseSearch = searchText.toLowerCase();
      filtered = filtered.filter(file => 
        file.name.toLowerCase().includes(lowerCaseSearch)
      );
    }
    
    if (fileTypeFilter !== 'all') {
      if (fileTypeFilter === 'images') {
        filtered = filtered.filter(file => ['jpg', 'png', 'gif'].includes(file.type));
      } else if (fileTypeFilter === 'documents') {
        filtered = filtered.filter(file => ['doc', 'docx', 'pdf', 'txt'].includes(file.type));
      } else if (fileTypeFilter === 'directories') {
        filtered = filtered.filter(file => file.is_directory);
      }
    }
    
    setFilteredFiles(sortFiles(filtered));
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(event.target.value);
  };

  const handleFileTypeFilterChange = (event: SelectChangeEvent<string>) => {
    setFileTypeFilter(event.target.value);
  };

  const handleResetFilters = () => {
    setSearchText('');
    setFileTypeFilter('all');
  };

  const handleRefresh = () => {
    fetchFiles();
    fetchStats();
  };

  const handleViewFile = (file: FileItem) => {
    setSelectedFile(file);
    setPreviewDialogOpen(true);
  };

  const handleDownloadFile = async (file: FileItem) => {
    try {
      const user = authService.getUser();
      const userId = user?.id;
      
      const response = await axios.get(`/api/admin/files/download`, {
        params: { 
          user_id: userId,
          path: file.path
        },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.name);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Ошибка при скачивании файла:', error);
    }
  };

  const handleDeleteFile = async (file: FileItem) => {
    if (window.confirm(`Вы уверены, что хотите удалить ${file.is_directory ? 'директорию' : 'файл'} "${file.name}"?`)) {
      try {
        const user = authService.getUser();
        const userId = user?.id;
        
        await axios.delete(`/api/admin/files`, {
          params: { 
            user_id: userId,
            path: file.path
          }
        });
        
        fetchFiles();
        fetchStats();
      } catch (error) {
        console.error('Ошибка при удалении файла:', error);
      }
    }
  };

  const handleCloseDialog = () => {
    setPreviewDialogOpen(false);
    setSelectedFile(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Б';
    const k = 1024;
    const sizes = ['Б', 'КБ', 'МБ', 'ГБ', 'ТБ'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string, isDirectory: boolean) => {
    if (isDirectory) {
      return <FolderIcon size={24} />;
    }
    
    if (fileType === 'pdf') {
      return <PdfIcon size={24} />;
    } else if (['doc', 'docx'].includes(fileType)) {
      return <DocIcon size={24} />;
    } else if (['jpg', 'png', 'gif'].includes(fileType)) {
      return <ImageIcon size={24} />;
    } else {
      return <FileIcon size={24} />;
    }
  };

  const handleNavigateToDirectory = (path: string) => {
    setPathHistory([...pathHistory, path]);
    setCurrentPath(path);
  };

  const handleNavigateBack = () => {
    if (pathHistory.length > 1) {
      const newHistory = [...pathHistory];
      newHistory.pop(); // Удаляем текущий путь
      const previousPath = newHistory[newHistory.length - 1];
      setPathHistory(newHistory);
      setCurrentPath(previousPath);
    }
  };

  const handleUploadFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const formData = new FormData();
    formData.append('file', files[0]);
    formData.append('path', currentPath);
    
    try {
      const user = authService.getUser();
      const userId = user?.id;
      
      await axios.post('/api/admin/files/upload', formData, {
        params: { user_id: userId },
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      fetchFiles();
      fetchStats();
    } catch (error) {
      console.error('Ошибка при загрузке файла:', error);
    }
  };

  const handleCreateDirectory = async () => {
    const dirName = prompt('Введите название директории:');
    if (!dirName) return;
    
    try {
      const user = authService.getUser();
      const userId = user?.id;
      
      await axios.post('/api/admin/files/create-directory', null, {
        params: { 
          user_id: userId,
          path: currentPath,
          name: dirName
        }
      });
      
      fetchFiles();
      fetchStats();
    } catch (error) {
      console.error('Ошибка при создании директории:', error);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Менеджер файлов
      </Typography>
      
      {/* Статистика */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Всего файлов
              </Typography>
              <Typography variant="h5">
                {stats.totalFiles}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Всего директорий
              </Typography>
              <Typography variant="h5">
                {stats.totalDirectories}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Общий размер
              </Typography>
              <Typography variant="h5">
                {formatFileSize(stats.totalSize)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Панель инструментов */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Поиск файлов..."
              value={searchText}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: <SearchIcon style={{ marginRight: 8 }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>Тип файла</InputLabel>
              <Select
                value={fileTypeFilter}
                onChange={handleFileTypeFilterChange}
                label="Тип файла"
              >
                <MenuItem value="all">Все файлы</MenuItem>
                <MenuItem value="directories">Только директории</MenuItem>
                <MenuItem value="documents">Документы</MenuItem>
                <MenuItem value="images">Изображения</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleResetFilters}
              startIcon={<CloseIcon />}
            >
              Сбросить фильтры
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleRefresh}
              startIcon={<RefreshIcon />}
            >
              Обновить
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Панель навигации */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <Button
              variant="outlined"
              onClick={handleNavigateBack}
              disabled={pathHistory.length <= 1}
            >
              Назад
            </Button>
          </Grid>
          <Grid item xs>
            <Typography variant="body1">
              Текущий путь: {currentPath}
            </Typography>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              onClick={handleCreateDirectory}
              startIcon={<FolderIcon />}
            >
              Создать директорию
            </Button>
          </Grid>
          <Grid item>
            <input
              type="file"
              id="file-upload"
              style={{ display: 'none' }}
              onChange={handleUploadFile}
            />
            <label htmlFor="file-upload">
              <Button
                variant="contained"
                component="span"
                startIcon={<UploadIcon />}
              >
                Загрузить файл
              </Button>
            </label>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Таблица файлов */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="error">{error}</Typography>
            <Button
              variant="contained"
              onClick={handleRefresh}
              sx={{ mt: 2 }}
            >
              Повторить
            </Button>
          </Box>
        ) : (
          <TableContainer>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'name'}
                      direction={orderBy === 'name' ? order : 'asc'}
                      onClick={() => handleRequestSort('name')}
                    >
                      Имя
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'type'}
                      direction={orderBy === 'type' ? order : 'asc'}
                      onClick={() => handleRequestSort('type')}
                    >
                      Тип
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">
                    <TableSortLabel
                      active={orderBy === 'size'}
                      direction={orderBy === 'size' ? order : 'asc'}
                      onClick={() => handleRequestSort('size')}
                    >
                      Размер
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">
                    <TableSortLabel
                      active={orderBy === 'created_at'}
                      direction={orderBy === 'created_at' ? order : 'asc'}
                      onClick={() => handleRequestSort('created_at')}
                    >
                      Дата создания
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">
                    <TableSortLabel
                      active={orderBy === 'updated_at'}
                      direction={orderBy === 'updated_at' ? order : 'asc'}
                      onClick={() => handleRequestSort('updated_at')}
                    >
                      Дата изменения
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="center">Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredFiles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      Файлы не найдены
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFiles.map((file) => (
                    <TableRow key={file.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {getFileIcon(file.type, file.is_directory)}
                          <Typography
                            sx={{ ml: 1, cursor: file.is_directory ? 'pointer' : 'default' }}
                            onClick={() => file.is_directory && handleNavigateToDirectory(file.path)}
                          >
                            {file.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {file.is_directory ? (
                          <Chip label="Директория" color="primary" size="small" />
                        ) : (
                          <Chip label={file.type.toUpperCase()} size="small" />
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {file.is_directory ? '-' : formatFileSize(file.size)}
                      </TableCell>
                      <TableCell align="right">{formatDate(file.created_at)}</TableCell>
                      <TableCell align="right">{formatDate(file.updated_at)}</TableCell>
                      <TableCell align="center">
                        {!file.is_directory && (
                          <>
                            <Tooltip title="Просмотр">
                              <IconButton
                                size="small"
                                onClick={() => handleViewFile(file)}
                              >
                                <ViewIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Скачать">
                              <IconButton
                                size="small"
                                onClick={() => handleDownloadFile(file)}
                              >
                                <DownloadIcon />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                        <Tooltip title="Удалить">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteFile(file)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
      
      {/* Диалог предпросмотра */}
      <Dialog
        open={previewDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedFile?.name}
        </DialogTitle>
        <DialogContent>
          {selectedFile && (
            <Box sx={{ p: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Путь:</Typography>
                  <Typography variant="body1">{selectedFile.path}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Тип:</Typography>
                  <Typography variant="body1">{selectedFile.type.toUpperCase()}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Размер:</Typography>
                  <Typography variant="body1">{formatFileSize(selectedFile.size)}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Дата создания:</Typography>
                  <Typography variant="body1">{formatDate(selectedFile.created_at)}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Дата изменения:</Typography>
                  <Typography variant="body1">{formatDate(selectedFile.updated_at)}</Typography>
                </Grid>
              </Grid>
              
              {/* Предпросмотр файла */}
              {selectedFile.type.startsWith('image/') && (
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <img
                    src={`/api/admin/files/preview?path=${encodeURIComponent(selectedFile.path)}`}
                    alt={selectedFile.name}
                    style={{ maxWidth: '100%', maxHeight: '400px' }}
                  />
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Закрыть</Button>
          {selectedFile && !selectedFile.is_directory && (
            <Button
              variant="contained"
              onClick={() => handleDownloadFile(selectedFile)}
              startIcon={<DownloadIcon />}
            >
              Скачать
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FileManager; 