import React, { useState } from 'react';
import Radio from '@mui/material/Radio';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  TextField,
  Grid,
  IconButton,
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
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Divider,
} from '@mui/material';
import {
  MdSave as SaveIcon,
  MdAdd as AddIcon,
  MdEdit as EditIcon,
  MdDelete as DeleteIcon,
  MdLanguage as LanguageIcon,
  MdTranslate as TranslateIcon,
} from 'react-icons/md';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

// Интерфейс для языков
interface Language {
  code: string;
  name: string;
  isDefault: boolean;
  isActive: boolean;
}

// Интерфейс для переводов
interface Translation {
  id: number;
  key: string;
  description: string;
  translations: Record<string, string>;
}

const Settings: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [languages, setLanguages] = useState<Language[]>([
    { code: 'ru', name: 'Русский', isDefault: true, isActive: true },
    { code: 'en', name: 'English', isDefault: false, isActive: true },
    { code: 'es', name: 'Español', isDefault: false, isActive: false },
    { code: 'fr', name: 'Français', isDefault: false, isActive: false },
  ]);
  
  const [translations, setTranslations] = useState<Translation[]>([
    { 
      id: 1, 
      key: 'welcome_message', 
      description: 'Приветственное сообщение',
      translations: {
        ru: 'Добро пожаловать в Unlim Mind AI',
        en: 'Welcome to Unlim Mind AI',
        es: 'Bienvenido a Unlim Mind AI',
        fr: 'Bienvenue sur Unlim Mind AI',
      },
    },
    { 
      id: 2, 
      key: 'login_button', 
      description: 'Кнопка входа',
      translations: {
        ru: 'Войти',
        en: 'Log In',
        es: 'Iniciar sesión',
        fr: 'Se connecter',
      },
    },
    { 
      id: 3, 
      key: 'error_message', 
      description: 'Сообщение об ошибке',
      translations: {
        ru: 'Произошла ошибка',
        en: 'An error occurred',
        es: 'Se ha producido un error',
        fr: 'Une erreur s\'est produite',
      },
    },
  ]);

  const [editingTranslation, setEditingTranslation] = useState<Translation | null>(null);
  const [newLanguageCode, setNewLanguageCode] = useState('');
  const [newLanguageName, setNewLanguageName] = useState('');
  
  // Настройки системы
  const [systemSettings, setSystemSettings] = useState({
    maxRequestsPerMinute: 60,
    defaultAIModel: 'gpt-4',
    logLevel: 'info',
    debugMode: false,
    maintenanceMode: false,
  });

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleLanguageToggle = (code: string) => {
    setLanguages(languages.map(lang => 
      lang.code === code ? { ...lang, isActive: !lang.isActive } : lang
    ));
  };

  const handleDefaultLanguageChange = (code: string) => {
    setLanguages(languages.map(lang => 
      ({ ...lang, isDefault: lang.code === code })
    ));
  };

  const handleDeleteLanguage = (code: string) => {
    // В реальном приложении вам нужно проверить, используется ли язык где-то
    if (code !== 'ru' && code !== 'en') { // Не позволяем удалять базовые языки
      setLanguages(languages.filter(lang => lang.code !== code));
      // Также нужно обновить все переводы, удалив данные для этого языка
    }
  };

  const handleAddLanguage = () => {
    if (newLanguageCode && newLanguageName && !languages.some(l => l.code === newLanguageCode)) {
      setLanguages([
        ...languages,
        { code: newLanguageCode, name: newLanguageName, isDefault: false, isActive: true }
      ]);
      setNewLanguageCode('');
      setNewLanguageName('');
    }
  };

  const handleEditTranslation = (translation: Translation) => {
    setEditingTranslation(translation);
  };

  const handleSaveTranslation = () => {
    if (editingTranslation) {
      setTranslations(translations.map(t => 
        t.id === editingTranslation.id ? editingTranslation : t
      ));
      setEditingTranslation(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingTranslation(null);
  };

  const handleTranslationChange = (languageCode: string, value: string) => {
    if (editingTranslation) {
      setEditingTranslation({
        ...editingTranslation,
        translations: {
          ...editingTranslation.translations,
          [languageCode]: value
        }
      });
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Настройки
      </Typography>

      <Paper sx={{ width: '100%', mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Общие настройки" icon={<LanguageIcon />} iconPosition="start" />
          <Tab label="Языки" icon={<LanguageIcon />} iconPosition="start" />
          <Tab label="Переводы" icon={<TranslateIcon />} iconPosition="start" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Настройки системы
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    label="Максимум запросов в минуту"
                    type="number"
                    value={systemSettings.maxRequestsPerMinute}
                    onChange={(e) => setSystemSettings({
                      ...systemSettings,
                      maxRequestsPerMinute: parseInt(e.target.value, 10) || 0
                    })}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Модель AI по умолчанию</InputLabel>
                    <Select
                      value={systemSettings.defaultAIModel}
                      label="Модель AI по умолчанию"
                      onChange={(e) => setSystemSettings({
                        ...systemSettings,
                        defaultAIModel: e.target.value
                      })}
                    >
                      <MenuItem value="gpt-3.5">GPT-3.5</MenuItem>
                      <MenuItem value="gpt-4o">GPT-4o</MenuItem>
                      <MenuItem value="claude">Claude</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Уровень логирования</InputLabel>
                    <Select
                      value={systemSettings.logLevel}
                      label="Уровень логирования"
                      onChange={(e) => setSystemSettings({
                        ...systemSettings,
                        logLevel: e.target.value
                      })}
                    >
                      <MenuItem value="debug">Debug</MenuItem>
                      <MenuItem value="info">Info</MenuItem>
                      <MenuItem value="warning">Warning</MenuItem>
                      <MenuItem value="error">Error</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={systemSettings.debugMode}
                        onChange={(e) => setSystemSettings({
                          ...systemSettings,
                          debugMode: e.target.checked
                        })}
                      />
                    }
                    label="Режим отладки"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={systemSettings.maintenanceMode}
                        onChange={(e) => setSystemSettings({
                          ...systemSettings,
                          maintenanceMode: e.target.checked
                        })}
                      />
                    }
                    label="Режим обслуживания"
                  />
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                >
                  Сохранить настройки
                </Button>
              </Box>
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Добавить новый язык
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Код языка (напр. de, fr)"
                        value={newLanguageCode}
                        onChange={(e) => setNewLanguageCode(e.target.value.toLowerCase())}
                        helperText="ISO 639-1 код (2 символа)"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Название языка"
                        value={newLanguageName}
                        onChange={(e) => setNewLanguageName(e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleAddLanguage}
                        disabled={!newLanguageCode || !newLanguageName}
                      >
                        Добавить язык
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Язык</TableCell>
                      <TableCell>Код</TableCell>
                      <TableCell>По умолчанию</TableCell>
                      <TableCell>Активен</TableCell>
                      <TableCell>Действия</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {languages.map((language) => (
                      <TableRow key={language.code}>
                        <TableCell>{language.name}</TableCell>
                        <TableCell>
                          <Chip label={language.code} />
                        </TableCell>
                        <TableCell>
                          <Radio
                            checked={language.isDefault}
                            onChange={() => handleDefaultLanguageChange(language.code)}
                          />
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={language.isActive}
                            onChange={() => handleLanguageToggle(language.code)}
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton
                            color="error"
                            onClick={() => handleDeleteLanguage(language.code)}
                            disabled={language.isDefault || language.code === 'ru' || language.code === 'en'}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {editingTranslation ? (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Редактирование перевода
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Ключ"
                    value={editingTranslation.key}
                    onChange={(e) => setEditingTranslation({
                      ...editingTranslation,
                      key: e.target.value
                    })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Описание"
                    value={editingTranslation.description}
                    onChange={(e) => setEditingTranslation({
                      ...editingTranslation,
                      description: e.target.value
                    })}
                  />
                </Grid>
                
                {languages.filter(l => l.isActive).map((language) => (
                  <Grid item xs={12} key={language.code}>
                    <TextField
                      fullWidth
                      label={`${language.name} (${language.code})`}
                      value={editingTranslation.translations[language.code] || ''}
                      onChange={(e) => handleTranslationChange(language.code, e.target.value)}
                    />
                  </Grid>
                ))}
                
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                    <Button variant="outlined" onClick={handleCancelEdit}>
                      Отменить
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={handleSaveTranslation}
                    >
                      Сохранить
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          ) : (
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
              >
                Добавить перевод
              </Button>
            </Box>
          )}
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Ключ</TableCell>
                  <TableCell>Описание</TableCell>
                  {languages.filter(l => l.isActive).map((language) => (
                    <TableCell key={language.code}>
                      {language.name} ({language.code})
                    </TableCell>
                  ))}
                  <TableCell>Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {translations.map((translation) => (
                  <TableRow key={translation.id}>
                    <TableCell>{translation.key}</TableCell>
                    <TableCell>{translation.description}</TableCell>
                    {languages.filter(l => l.isActive).map((language) => (
                      <TableCell key={language.code}>
                        {translation.translations[language.code] || '—'}
                      </TableCell>
                    ))}
                    <TableCell>
                      <IconButton
                        color="primary"
                        onClick={() => handleEditTranslation(translation)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton color="error">
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default Settings; 