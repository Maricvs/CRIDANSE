# Настройка админ-панели Unlim Mind AI

## Настройка веб-сервера Nginx

1. Скопируйте конфигурацию nginx из файла `nginx-admin-panel.conf` в директорию `/etc/nginx/sites-available/`:

```bash
sudo cp nginx-admin-panel.conf /etc/nginx/sites-available/admin.unlim-mind.ai
```

2. Создайте символическую ссылку в директории `sites-enabled`:

```bash
sudo ln -s /etc/nginx/sites-available/admin.unlim-mind.ai /etc/nginx/sites-enabled/
```

3. Проверьте конфигурацию nginx:

```bash
sudo nginx -t
```

## Настройка SSL-сертификата

1. Установите certbot, если еще не установлен:

```bash
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx
```

2. Получите SSL-сертификат для домена админ-панели:

```bash
sudo certbot --nginx -d admin.unlim-mind.ai
```

3. Следуйте инструкциям certbot для завершения процесса.

4. Перезапустите nginx:

```bash
sudo systemctl restart nginx
```

## Проверка работоспособности

После завершения процесса настройки, админ-панель должна быть доступна по адресу:

```
https://admin.unlim-mind.ai
```

Для входа используйте:
- Логин: `admin`
- Пароль: `admin123`

## Обновление deploy.yml

Файл `.github/workflows/deploy.yml` уже обновлен для автоматического деплоя админ-панели при каждом пуше в ветку main. 
Добавлены следующие функции:

1. Автоматическая сборка и деплой админ-панели
2. Уведомления в Telegram о статусе админ-панели
3. Мониторинг доступности админ-панели

При каждом пуше система будет проверять работоспособность:
- Backend (API)
- Nginx
- Фронтенд
- Админ-панель

И отправлять уведомления о статусе в Telegram. 