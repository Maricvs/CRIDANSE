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
} from 'react-icons/md';

// Интерфейс для документа
interface Document {
  id: number;
  title: string;
  description: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
  updatedAt: string;
  userId: number;
  userName: string;
  userAvatar?: string;
}

type Order = 'asc' | 'desc';

const DocumentsList: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState<string>('all');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [orderBy, setOrderBy] = useState<keyof Document>('createdAt');
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
  }, []);

  useEffect(() => {
    filterDocuments();
  }, [documents, searchText, fileTypeFilter, orderBy, order]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      // Имитация запроса к API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Моковые данные
      const fileTypes = ['pdf', 'doc', 'docx', 'jpg', 'png', 'txt'];
      const mockDocuments: Document[] = Array.from({ length: 30 }, (_, i) => {
        const fileType = fileTypes[Math.floor(Math.random() * fileTypes.length)];
        const fileSize = Math.floor(Math.random() * 10000000) + 100000; // от 100KB до 10MB
        
        const createdDate = new Date();
        createdDate.setDate(createdDate.getDate() - Math.floor(Math.random() * 30));
        
        const updatedDate = new Date(createdDate);
        updatedDate.setDate(updatedDate.getDate() + Math.floor(Math.random() * 10));
        
        return {
          id: i + 1,
          title: `Документ ${i + 1} - ${['Отчет', 'Презентация', 'Исследование', 'Инструкция', 'Договор'][Math.floor(Math.random() * 5)]}`,
          description: `Описание документа ${i + 1}. ${['Важный документ для работы.', 'Содержит конфиденциальную информацию.', 'Техническая документация по проекту.', 'Результаты исследования.'][Math.floor(Math.random() * 4)]}`,
          fileType,
          fileSize,
          createdAt: createdDate.toISOString(),
          updatedAt: updatedDate.toISOString(),
          userId: Math.floor(Math.random() * 10) + 1,
          userName: ['Иван Петров', 'Анна Смирнова', 'Сергей Иванов', 'Екатерина Козлова', 'Алексей Николаев'][Math.floor(Math.random() * 5)],
          userAvatar: Math.random() > 0.3 ? `https://randomuser.me/api/portraits/${Math.random() > 0.5 ? 'men' : 'women'}/${Math.floor(Math.random() * 50) + 1}.jpg` : undefined,
        };
      });
      
      setDocuments(mockDocuments);
      
      // Обновляем статистику
      const pdfCount = mockDocuments.filter(doc => doc.fileType === 'pdf').length;
      const docCount = mockDocuments.filter(doc => doc.fileType === 'doc' || doc.fileType === 'docx').length;
      const imageCount = mockDocuments.filter(doc => doc.fileType === 'jpg' || doc.fileType === 'png').length;
      const totalSize = mockDocuments.reduce((sum, doc) => sum + doc.fileSize, 0);
      
      setStats({
        totalDocuments: mockDocuments.length,
        pdfCount,
        docCount,
        imageCount,
        totalSize,
      });
      
    } catch (error) {
      console.error('Ошибка при загрузке документов:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSort = (property: keyof Document) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortDocuments = (docs: Document[]) => {
    return [...docs].sort((a, b) => {
      if (orderBy === 'createdAt' || orderBy === 'updatedAt') {
        return order === 'desc' 
          ? new Date(b[orderBy]).getTime() - new Date(a[orderBy]).getTime()
          : new Date(a[orderBy]).getTime() - new Date(b[orderBy]).getTime();
      }
      
      if (orderBy === 'fileSize') {
        return order === 'desc' 
          ? b.fileSize - a.fileSize
          : a.fileSize - b.fileSize;
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
        doc.userName.toLowerCase().includes(lowerCaseSearch)
      );
    }
    
    if (fileTypeFilter !== 'all') {
      if (fileTypeFilter === 'images') {
        filtered = filtered.filter(doc => ['jpg', 'png', 'gif'].includes(doc.fileType));
      } else if (fileTypeFilter === 'documents') {
        filtered = filtered.filter(doc => ['doc', 'docx', 'pdf', 'txt'].includes(doc.fileType));
      } else {
        filtered = filtered.filter(doc => doc.fileType === fileTypeFilter);
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
  };

  const handleViewDocument = (doc: Document) => {
    setSelectedDocument(doc);
    setPreviewDialogOpen(true);
  };

  const handleDownloadDocument = async (doc: Document) => {
    try {
      // Имитация запроса на скачивание документа
      console.log(`Скачивание документа: ${doc.title}`);
      
      // В реальном приложении здесь будет запрос к API для получения URL для скачивания
      // const response = await fetch(`/api/documents/${doc.id}/download`);
      // const data = await response.json();
      
      // Создаем временную ссылку для скачивания
      const link = document.createElement('a');
      link.href = `https://example.com/api/documents/${doc.id}/download`; // Замените на реальный URL
      link.download = doc.title;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Показываем уведомление об успешном скачивании
      alert(`Документ "${doc.title}" успешно скачан`);
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
      // Имитация запроса на удаление документарр
      console.log(`Удаление документа: ${doc.title}`);
      
      // В реальном приложении здесь будет запрос к API для удаления документа
      // const response = await fetch(`/api/documents/${doc.id}`, {
      //   method: 'DELETE',
      //   headers: {
      //     'Content-Type': 'application/json'
      //   }
      // });
      
      // if (!response.ok) {
      //   throw new Error('Ошибка при удалении документа');
      // }
      
      // Обновляем список документов после успешного удаления
      setDocuments(prevDocs => prevDocs.filter(d => d.id !== doc.id));
      
      // Показываем уведомление об успешном удалении
      alert(`Документ "${doc.title}" успешно удален`);
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
            >
              Загрузить
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
                      active={orderBy === 'fileType'}
                      direction={orderBy === 'fileType' ? order : 'asc'}
                      onClick={() => handleRequestSort('fileType')}
                    >
                      Тип
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'fileSize'}
                      direction={orderBy === 'fileSize' ? order : 'asc'}
                      onClick={() => handleRequestSort('fileSize')}
                    >
                      Размер
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'createdAt'}
                      direction={orderBy === 'createdAt' ? order : 'asc'}
                      onClick={() => handleRequestSort('createdAt')}
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
                    <TableCell>{doc.id}</TableCell>
                    <TableCell>
                      <Box style={{ display: 'flex', alignItems: 'center' }}>
                        {getFileIcon(doc.fileType)}
                        <Typography style={{ marginLeft: '8px' }}>{doc.title}</Typography>
                      </Box>
                      <Typography variant="caption" color="textSecondary">
                        {doc.description.length > 60 ? `${doc.description.slice(0, 60)}...` : doc.description}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={doc.fileType.toUpperCase()}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{formatFileSize(doc.fileSize)}</TableCell>
                    <TableCell>{formatDate(doc.createdAt)}</TableCell>
                    <TableCell>
                      <Box style={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar
                          src={doc.userAvatar}
                          alt={doc.userName}
                          style={{ width: 30, height: 30, marginRight: '8px' }}
                        />
                        {doc.userName}
                      </Box>
                    </TableCell>
                    <TableCell>
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
                {getFileIcon(selectedDocument.fileType)}
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
                      label={selectedDocument.fileType.toUpperCase()}
                      size="small"
                      variant="outlined"
                      style={{ marginRight: '8px' }}
                    />
                    {formatFileSize(selectedDocument.fileSize)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">Загружен</Typography>
                  <Typography variant="body1">{formatDate(selectedDocument.createdAt)}</Typography>
                  
                  <Typography variant="subtitle2" color="textSecondary" style={{ marginTop: '8px' }}>Последнее обновление</Typography>
                  <Typography variant="body1">{formatDate(selectedDocument.updatedAt)}</Typography>
                  
                  <Typography variant="subtitle2" color="textSecondary" style={{ marginTop: '8px' }}>Пользователь</Typography>
                  <Box style={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar
                      src={selectedDocument.userAvatar}
                      alt={selectedDocument.userName}
                      style={{ width: 24, height: 24, marginRight: '8px' }}
                    />
                    <Typography variant="body1">
                      {selectedDocument.userName} (ID: {selectedDocument.userId})
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
                    {['jpg', 'png', 'gif'].includes(selectedDocument.fileType) ? (
                      <Box component="img" 
                        src={`https://via.placeholder.com/800x400?text=Предпросмотр+изображения+недоступен`} 
                        alt={selectedDocument.title}
                        style={{ maxWidth: '100%', maxHeight: 300, objectFit: 'contain' }}
                      />
                    ) : (
                      <>
                        <Typography variant="body1" style={{ marginBottom: '16px' }}>
                          Предпросмотр для файла типа {selectedDocument.fileType.toUpperCase()} недоступен
                        </Typography>
                        <Button
                          variant="contained"
                          startIcon={<DownloadIcon />}
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
              <Button color="primary" startIcon={<DownloadIcon />}>
                Скачать
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default DocumentsList; 