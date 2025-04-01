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
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Description as DocumentIcon,
  FileUpload as UploadIcon,
  Download as DownloadIcon,
  FileCopy as FileIcon,
  PictureAsPdf as PdfIcon,
  InsertDriveFile as DocIcon,
  Image as ImageIcon,
} from '@mui/icons-material';

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

const DocumentsList: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState<string>('all');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);

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
  }, [documents, searchText, fileTypeFilter]);

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
    switch (fileType) {
      case 'pdf':
        return <PdfIcon sx={{ color: '#f44336' }} />;
      case 'doc':
      case 'docx':
        return <DocIcon sx={{ color: '#2196f3' }} />;
      case 'jpg':
      case 'png':
      case 'gif':
        return <ImageIcon sx={{ color: '#4caf50' }} />;
      default:
        return <FileIcon />;
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Документы
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title="Загрузить новый документ">
            <Button
              variant="contained"
              startIcon={<UploadIcon />}
              sx={{ mr: 1 }}
            >
              Загрузить
            </Button>
          </Tooltip>
          <Tooltip title="Обновить список">
            <IconButton onClick={handleRefresh} color="primary" sx={{ mr: 1 }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <DocumentIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4">{stats.totalDocuments}</Typography>
              <Typography variant="body2" color="textSecondary">Всего документов</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <PdfIcon sx={{ fontSize: 40, mb: 1, color: '#f44336' }} />
              <Typography variant="h4">{stats.pdfCount}</Typography>
              <Typography variant="body2" color="textSecondary">PDF файлов</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <DocIcon sx={{ fontSize: 40, mb: 1, color: '#2196f3' }} />
              <Typography variant="h4">{stats.docCount}</Typography>
              <Typography variant="body2" color="textSecondary">DOC файлов</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <DocumentIcon sx={{ fontSize: 40, mb: 1, color: '#ff9800' }} />
              <Typography variant="h4">{formatFileSize(stats.totalSize)}</Typography>
              <Typography variant="body2" color="textSecondary">Общий размер</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2, mb: 3 }}>
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
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
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

      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        Найдено: {filteredDocuments.length} документов
      </Typography>

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Название</TableCell>
                  <TableCell>Тип</TableCell>
                  <TableCell>Размер</TableCell>
                  <TableCell>Загружен</TableCell>
                  <TableCell>Пользователь</TableCell>
                  <TableCell>Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredDocuments.map((doc) => (
                  <TableRow key={doc.id} hover>
                    <TableCell>{doc.id}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {getFileIcon(doc.fileType)}
                        <Typography sx={{ ml: 1 }}>{doc.title}</Typography>
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
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar
                          src={doc.userAvatar}
                          alt={doc.userName}
                          sx={{ width: 30, height: 30, mr: 1 }}
                        />
                        {doc.userName}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Просмотреть документ">
                        <IconButton
                          color="primary"
                          size="small"
                          onClick={() => handleViewDocument(doc)}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Скачать документ">
                        <IconButton
                          color="success"
                          size="small"
                        >
                          <DownloadIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Удалить документ">
                        <IconButton
                          color="error"
                          size="small"
                        >
                          <DeleteIcon />
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

      {/* Диалог для просмотра документа */}
      <Dialog
        open={previewDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        {selectedDocument && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {getFileIcon(selectedDocument.fileType)}
                <Typography variant="h6" sx={{ ml: 1 }}>
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
                      sx={{ mr: 1 }}
                    />
                    {formatFileSize(selectedDocument.fileSize)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">Загружен</Typography>
                  <Typography variant="body1">{formatDate(selectedDocument.createdAt)}</Typography>
                  
                  <Typography variant="subtitle2" color="textSecondary" sx={{ mt: 1 }}>Последнее обновление</Typography>
                  <Typography variant="body1">{formatDate(selectedDocument.updatedAt)}</Typography>
                  
                  <Typography variant="subtitle2" color="textSecondary" sx={{ mt: 1 }}>Пользователь</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar
                      src={selectedDocument.userAvatar}
                      alt={selectedDocument.userName}
                      sx={{ width: 24, height: 24, mr: 1 }}
                    />
                    <Typography variant="body1">
                      {selectedDocument.userName} (ID: {selectedDocument.userId})
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ 
                    mt: 2, 
                    p: 3, 
                    border: '1px dashed', 
                    borderColor: 'divider',
                    borderRadius: 1,
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
                        sx={{ maxWidth: '100%', maxHeight: 300, objectFit: 'contain' }}
                      />
                    ) : (
                      <>
                        <Typography variant="body1" sx={{ mb: 2 }}>
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