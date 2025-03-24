Before we start the project based on frontend React on server

install PostgreSQL
apt update && apt install -y postgresql postgresql-contrib

Start and autolaunch
systemctl start postgresql
systemctl enable postgresql

Install locales
apt install locales
dpkg-reconfigure locales - choose en_US.UTF-8

(warning -  This will select the default language for the entire system. If this system is a multi-user system where not all users are able to speak the default language, they will experience difficulties.  )


Enter in DB
-u postgres psql


Creating DB
CREATE DATABASE unlim_ai;
CREATE USER unlim_user WITH ENCRYPTED PASSWORD 'Nezabudu';
ALTER ROLE unlim_user SET client_encoding TO 'utf8';
ALTER ROLE unlim_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE unlim_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE unlim_ai TO unlim_user;

check status
systemctl status postgresql

and see error
psql: error: connection to server on socket "/var/run/postgresql/.s.PGSQL.5432" failed: FATAL:  Peer authentication failed for user "unlim_user"

then make change in conf
sudo nano /etc/postgresql/15/main/pg_hba.conf

change the peer to md5 (to change for pas authentication)
local   all             postgres                                md5
local   all             all                                     md5

Grant Privileges on schema to user unlim_user
GRANT ALL PRIVILEGES ON SCHEMA public TO unlim_user;

restart
sudo systemctl restart postgresql

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,  -- Хешированный пароль
    role VARCHAR(50) NOT NULL,       -- Роль (admin, teacher, student)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE chats (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_user BOOLEAN NOT NULL,  -- true для сообщений от пользователя, false для ответов от бота
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    document_name VARCHAR(255) NOT NULL,
    document_path TEXT NOT NULL,  -- Путь к файлу
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
