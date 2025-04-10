import React, { useState, useEffect } from 'react';
import { SelectChangeEvent } from '@mui/material/Select';
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
  TableSortLabel,
} from '@mui/material';
import {
  MdRefresh as RefreshIcon,
  MdSearch as SearchIcon,
  MdDelete as DeleteIcon,
  MdVisibility as ViewIcon,
  MdDescription as DocumentIcon,
  MdFileUpload as UploadIcon,
  MdFileDownload as DownloadIcon,
  MdInsertDriveFile as FileIcon,
  MdPictureAsPdf as PdfIcon,
  MdInsertDriveFile as DocIcon,
  MdImage as ImageIcon,
  MdMemory as MemoryIcon,
  MdClose as CloseIcon,
} from 'react-icons/md';
import axios from 'axios';
import { authService } from '../../services/auth';

// Интерфейс для документа
interface Document {
  id: number;
  title: string;
  description: string;
  file_type: string;
  file_size: number;
  created_at: string;
  updated_at: string;
  user_id: number;
  user_name?: string | null;
  user_avatar?: string;
  is_deleted: boolean;
  vectorization?: {
    total_chunks: number;
    chunks: Array<{
      id: number;
      index: number;
      content_preview: string;
      embedding_size: number;
      created_at: string;
    }>;
  };
}

type Order = 'asc' | 'desc';

const currentUser = authService.getUser();

const DocumentsList: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState<string>('all');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [vectorizationDialogOpen, setVectorizationDialogOpen] = useState(false);
  const [orderBy, setOrderBy] = useState<keyof Document>('created_at');
  const [order, setOrder] = useState<Order>('desc');

  // Статистика
  const [stats, setStats] = useState({
    totalDocuments: 0,
    pdfCount: 0,
    docCount: 0,
    imageCount: 0,
    totalSize: 0,
  });

  useEffect(() => {
    fetchDocuments();
    fetchStats();
  }, []);

  useEffect(() => {
    filterDocuments();
  }, [documents, searchText, fileTypeFilter, orderBy, order]);

  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = authService.getUser();
      if (!user?.id) {
        throw new Error('Пользователь не авторизован');
      }
      const response = await axios.get('/api/admin/documents/documents', {
        params: { user_id: user.id }
      });
      setDocuments(response.data);
    } catch (error) {
      console.error('Ошибка при загрузке документов:', error);
      setError('Не удалось загрузить документы. Пожалуйста, попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const user = authService.getUser();
      const userId = user?.id;
      const response = await axios.get('/api/admin/documents/stats', {
        params: { user_id: userId }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Ошибка при загрузке статистики:', error);
    }
  };

  const handleRequestSort = (property: keyof Document) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortDocuments = (docs: Document[]) => {
    return [...docs].sort((a, b) => {
      if (orderBy === 'created_at' || orderBy === 'updated_at') {
        return order === 'desc' 
          ? new Date(b[orderBy]).getTime() - new Date(a[orderBy]).getTime()
          : new Date(a[orderBy]).getTime() - new Date(b[orderBy]).getTime();
      }
      
      if (orderBy === 'file_size') {
        return order === 'desc' 
          ? b.file_size - a.file_size
          : a.file_size - b.file_size;
      }
      
      const aValue = a[orderBy] || '';
      const bValue = b[orderBy] || '';
      
      if (order === 'desc') {
        return String(bValue).localeCompare(String(aValue));
      }
      return String(aValue).localeCompare(String(bValue));
    });
  };

  const filterDocuments = () => {
    let filtered = [...documents];
    
    if (searchText) {
      const lowerCaseSearch = searchText.toLowerCase();
      filtered = filtered.filter(doc => 
        doc.title.toLowerCase().includes(lowerCaseSearch) ||
        doc.description.toLowerCase().includes(lowerCaseSearch) ||
        (doc.user_name?.toLowerCase() || '').includes(lowerCaseSearch)
      );
    }
    
    if (fileTypeFilter !== 'all') {
      if (fileTypeFilter === 'images') {
        filtered = filtered.filter(doc => ['jpg', 'png', 'gif'].includes(doc.file_type));
      } else if (fileTypeFilter === 'documents') {
        filtered = filtered.filter(doc => ['doc', 'docx', 'pdf', 'txt'].includes(doc.file_type));
      } else {
        filtered = filtered.filter(doc => doc.file_type === fileTypeFilter);
      }
    }
    
    // Сортировка
    filtered = sortDocuments(filtered);
    
    setFilteredDocuments(filtered);
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
    fetchDocuments();
    fetchStats();
  };

  const handleViewDocument = (doc: Document) => {
    setSelectedDocument(doc);
    setPreviewDialogOpen(true);
  };

  const handleDownloadDocument = async (doc: Document) => {
    try {
      const response = await axios.get(`/api/admin/documents/${doc.id}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc.title);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Ошибка при скачивании документа:', error);
      alert('Произошла ошибка при скачивании документа');
    }
  };

  const handleDeleteDocument = async (doc: Document) => {
    if (!window.confirm(`Вы уверены, что хотите удалить документ "${doc.title}"?`)) {
      return;
    }
    
    try {
      await axios.delete(`/api/documents/${doc.id}`);
      fetchDocuments();
      fetchStats();
    } catch (error) {
      console.error('Ошибка при удалении документа:', error);
      alert('Произошла ошибка при удалении документа');
    }
  };

  const handleCloseDialog = () => {
    setPreviewDialogOpen(false);
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    const iconStyle = { size: "1.5em" };
    switch (fileType) {
      case 'pdf':
        return <PdfIcon {...iconStyle} style={{ color: '#f44336' }} />;
      case 'doc':
      case 'docx':
        return <DocIcon {...iconStyle} style={{ color: '#2196f3' }} />;
      case 'jpg':
      case 'png':
      case 'gif':
        return <ImageIcon {...iconStyle} style={{ color: '#4caf50' }} />;
      default:
        return <FileIcon {...iconStyle} />;
    }
  };

  const handleViewVectorization = async (document: Document) => {
    try {
      const response = await axios.get(`/api/documents/${document.id}/vectorization`);
      setSelectedDocument({
        ...document,
        vectorization: response.data
      });
      setVectorizationDialogOpen(true);
    } catch (error) {
      console.error('Ошибка при загрузке информации о векторизации:', error);
    }
  };

  const handleUploadClick = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', file.name);
    formData.append('description', '');
    formData.append('user_id', currentUser.id.toString());

    try {
      await axios.post('/api/documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      fetchDocuments();
      fetchStats();
    } catch (error) {
      console.error('Ошибка при загрузке документа:', error);
      alert('Произошла ошибка при загрузке документа');
    }
  };

  return (
    <Box style={{ padding: '16px' }}>
      <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Документы
        </Typography>
        <Box style={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title="Загрузить новый документ">
            <Button
              variant="contained"
              startIcon={<UploadIcon />}
              style={{ marginRight: '8px' }}
              component="label"
            >
              Загрузить
              <input
                type="file"
                hidden
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    await handleUploadClick(file);
                  }
                }}
              />
            </Button>
          </Tooltip>
          <Tooltip title="Обновить список">
            <IconButton onClick={handleRefresh} color="primary" style={{ marginRight: '8px' }}>
              <RefreshIcon size={20} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Grid container spacing={3} style={{ marginBottom: '24px' }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent style={{ textAlign: 'center' }}>
              <DocumentIcon style={{ fontSize: 24, marginBottom: 8 }} />
              <Typography variant="h4">{stats.totalDocuments}</Typography>
              <Typography variant="body2" color="textSecondary">Всего документов</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent style={{ textAlign: 'center' }}>
              <PdfIcon style={{ fontSize: 24, marginBottom: 8, color: '#f44336' }} />
              <Typography variant="h4">{stats.pdfCount}</Typography>
              <Typography variant="body2" color="textSecondary">PDF файлов</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent style={{ textAlign: 'center' }}>
              <DocIcon style={{ fontSize: 24, marginBottom: 8, color: '#2196f3' }} />
              <Typography variant="h4">{stats.docCount}</Typography>
              <Typography variant="body2" color="textSecondary">DOC файлов</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent style={{ textAlign: 'center' }}>
              <ImageIcon style={{ fontSize: 24, marginBottom: 8, color: '#ff9800' }} />
              <Typography variant="h4">{formatFileSize(stats.totalSize)}</Typography>
              <Typography variant="body2" color="textSecondary">Общий размер</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper style={{ padding: '16px', marginBottom: '24px' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              placeholder="Поиск по названию, описанию или имени пользователя..."
              variant="outlined"
              size="small"
              value={searchText}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: <SearchIcon style={{ marginRight: 8, color: 'inherit' }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Тип файла</InputLabel>
              <Select
                value={fileTypeFilter}
                label="Тип файла"
                onChange={handleFileTypeFilterChange}
              >
                <MenuItem value="all">Все типы</MenuItem>
                <MenuItem value="documents">Документы</MenuItem>
                <MenuItem value="images">Изображения</MenuItem>
                <MenuItem value="pdf">PDF</MenuItem>
                <MenuItem value="doc">DOC</MenuItem>
                <MenuItem value="docx">DOCX</MenuItem>
                <MenuItem value="txt">TXT</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleResetFilters}
            >
              Сбросить
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Typography variant="subtitle1" style={{ marginBottom: '16px' }}>
        Найдено: {filteredDocuments.length} документов
      </Typography>

      {error && (
        <Box style={{ 
          padding: '16px', 
          marginBottom: '16px',
          backgroundColor: '#ffebee',
          borderRadius: '4px',
          border: '1px solid #ef5350'
        }}>
          <Typography color="error">{error}</Typography>
        </Box>
      )}

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
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'title'}
                      direction={orderBy === 'title' ? order : 'asc'}
                      onClick={() => handleRequestSort('title')}
                    >
                      Название
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'file_type'}
                      direction={orderBy === 'file_type' ? order : 'asc'}
                      onClick={() => handleRequestSort('file_type')}
                    >
                      Тип
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'file_size'}
                      direction={orderBy === 'file_size' ? order : 'asc'}
                      onClick={() => handleRequestSort('file_size')}
                    >
                      Размер
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'created_at'}
                      direction={orderBy === 'created_at' ? order : 'asc'}
                      onClick={() => handleRequestSort('created_at')}
                    >
                      Загружен
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Пользователь</TableCell>
                  <TableCell>Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredDocuments.map((doc) => (
                  <TableRow key={doc.id} hover>
                    <TableCell>
                      <Box style={{ display: 'flex', alignItems: 'center' }}>
                        {getFileIcon(doc.file_type)}
                        <Typography style={{ marginLeft: '8px' }}>{doc.title}</Typography>
                      </Box>
                      <Typography variant="caption" color="textSecondary">
                        {doc.description?.length > 60 ? `${doc.description.slice(0, 60)}...` : doc.description}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={doc.file_type.toUpperCase()}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{formatFileSize(doc.file_size)}</TableCell>
                    <TableCell>{formatDate(doc.created_at)}</TableCell>
                    <TableCell>
                      <Box style={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar
                          src={doc.user_avatar}
                          alt={doc.user_name || 'Пользователь'}
                          style={{ width: 30, height: 30, marginRight: '8px' }}
                        />
                        <Typography variant="body1">
                          {doc.user_name || 'Пользователь'} (ID: {doc.user_id})
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Информация о векторизации">
                        <IconButton
                          onClick={() => handleViewVectorization(doc)}
                          title="Информация о векторизации"
                        >
                          <MemoryIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Просмотреть">
                        <IconButton
                          color="primary"
                          size="small"
                          onClick={() => handleViewDocument(doc)}
                        >
                          <ViewIcon size={20} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Скачать">
                        <IconButton
                          color="primary"
                          size="small"
                          onClick={() => handleDownloadDocument(doc)}
                        >
                          <DownloadIcon size={20} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Удалить">
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => handleDeleteDocument(doc)}
                        >
                          <DeleteIcon size={20} />
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

      <Dialog
        open={previewDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        {selectedDocument && (
          <>
            <DialogTitle>
              <Box style={{ display: 'flex', alignItems: 'center' }}>
                {getFileIcon(selectedDocument.file_type)}
                <Typography variant="h6" style={{ marginLeft: '8px' }}>
                  {selectedDocument.title}
                </Typography>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">Описание</Typography>
                  <Typography variant="body1" paragraph>{selectedDocument.description}</Typography>
                  
                  <Typography variant="subtitle2" color="textSecondary">Тип файла</Typography>
                  <Typography variant="body1">
                    <Chip
                      label={selectedDocument.file_type.toUpperCase()}
                      size="small"
                      variant="outlined"
                      style={{ marginRight: '8px' }}
                    />
                    {formatFileSize(selectedDocument.file_size)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">Загружен</Typography>
                  <Typography variant="body1">{formatDate(selectedDocument.created_at)}</Typography>
                  
                  <Typography variant="subtitle2" color="textSecondary" style={{ marginTop: '8px' }}>Последнее обновление</Typography>
                  <Typography variant="body1">{formatDate(selectedDocument.updated_at)}</Typography>
                  
                  <Typography variant="subtitle2" color="textSecondary" style={{ marginTop: '8px' }}>Пользователь</Typography>
                  <Box style={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar
                      src={selectedDocument.user_avatar}
                      alt={selectedDocument.user_name}
                      style={{ width: 24, height: 24, marginRight: '8px' }}
                    />
                    <Typography variant="body1">
                      {selectedDocument.user_name} (ID: {selectedDocument.user_id})
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Box style={{ 
                    marginTop: '16px', 
                    padding: '24px', 
                    border: '1px dashed', 
                    borderColor: 'divider',
                    borderRadius: '4px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 200
                  }}>
                    {['jpg', 'png', 'gif'].includes(selectedDocument.file_type) ? (
                      <Box component="img" 
                        src={`/api/admin/documents/${selectedDocument.id}/download`} 
                        alt={selectedDocument.title}
                        style={{ maxWidth: '100%', maxHeight: 300, objectFit: 'contain' }}
                      />
                    ) : (
                      <>
                        <Typography variant="body1" style={{ marginBottom: '16px' }}>
                          Предпросмотр для файла типа {selectedDocument.file_type.toUpperCase()} недоступен
                        </Typography>
                        <Button
                          variant="contained"
                          startIcon={<DownloadIcon />}
                          onClick={() => handleDownloadDocument(selectedDocument)}
                        >
                          Скачать для просмотра
                        </Button>
                      </>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Закрыть</Button>
              <Button 
                color="primary" 
                startIcon={<DownloadIcon />}
                onClick={() => handleDownloadDocument(selectedDocument)}
              >
                Скачать
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Dialog
        open={vectorizationDialogOpen}
        onClose={() => setVectorizationDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Информация о векторизации документа
          <IconButton
            aria-label="close"
            onClick={() => setVectorizationDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedDocument?.vectorization && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedDocument.title}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                Всего чанков: {selectedDocument.vectorization.total_chunks}
              </Typography>
              
              <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Индекс</TableCell>
                      <TableCell>Предпросмотр содержимого</TableCell>
                      <TableCell>Размер эмбеддинга</TableCell>
                      <TableCell>Создан</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedDocument.vectorization.chunks.map((chunk) => (
                      <TableRow key={chunk.id}>
                        <TableCell>{chunk.index}</TableCell>
                        <TableCell>{chunk.content_preview}</TableCell>
                        <TableCell>{chunk.embedding_size}</TableCell>
                        <TableCell>
                          {new Date(chunk.created_at).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default DocumentsList; 