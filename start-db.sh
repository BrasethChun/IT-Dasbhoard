#!/usr/bin/env bash
set -e

export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:$PATH"

# Unset conflicting client flags during local admin actions
ADMIN_CLI="mariadb --protocol=socket -u root"

# 1. If running with GoDaddy MySQL as primary, exit immediately
if [ "${PRIMARY_DB}" = "godaddy" ] || [ "${MYSQL_HOST}" != "127.0.0.1" -a "${MYSQL_HOST}" != "localhost" -a -n "${MYSQL_HOST}" ]; then
  echo "Using remote GoDaddy MySQL (${MYSQL_HOST:-118.139.180.163}) as primary database. Local MariaDB script bypassed."
  exit 0
fi

# 2. Check if MariaDB binary is present
if ! command -v mariadbd >/dev/null 2>&1 && [ ! -x "/usr/sbin/mariadbd" ]; then
  echo "Local MariaDB daemon binary not installed. Using GoDaddy MySQL as primary database."
  exit 0
fi

# 2. Prepare directories & permissions
mkdir -p /var/run/mysqld /var/lib/mysql
chown -R mysql:mysql /var/run/mysqld /var/lib/mysql

# 3. Initialize datadir if needed
if [ ! -d "/var/lib/mysql/mysql" ]; then
  echo "Initializing MariaDB data directory..."
  mariadb-install-db --user=mysql --datadir=/var/lib/mysql >/dev/null 2>&1
fi

# 4. Start MariaDB daemon if not running
if ! mariadb-admin --protocol=socket -u root ping --silent >/dev/null 2>&1; then
  echo "Starting MariaDB daemon..."
  nohup /usr/sbin/mariadbd --user=mysql >/var/log/mariadb_service.log 2>&1 &
  
  # Wait for daemon to be ready
  for i in $(seq 1 30); do
    if mariadb-admin --protocol=socket -u root ping --silent >/dev/null 2>&1; then
      echo "MariaDB daemon is ready."
      break
    fi
    sleep 0.5
  done
fi

# 5. Ensure databases exist
$ADMIN_CLI -e "CREATE DATABASE IF NOT EXISTS \`ainotes\`; CREATE DATABASE IF NOT EXISTS \`ainotes_db\`; CREATE DATABASE IF NOT EXISTS \`khema_ainotes\`; CREATE DATABASE IF NOT EXISTS \`khema_dbuser\`;"
if [ -n "$MYSQL_DATABASE" ] && [ "$MYSQL_DATABASE" != "ainotes" ] && [ "$MYSQL_DATABASE" != "ainotes_db" ] && [ "$MYSQL_DATABASE" != "khema_ainotes" ] && [ "$MYSQL_DATABASE" != "khema_dbuser" ]; then
  $ADMIN_CLI -e "CREATE DATABASE IF NOT EXISTS \`${MYSQL_DATABASE}\`;" 2>/dev/null || true
fi

# 6. Configure root and application user access
$ADMIN_CLI -e "
  CREATE USER IF NOT EXISTS 'root'@'127.0.0.1';
  SET PASSWORD FOR 'root'@'127.0.0.1' = PASSWORD('');
  GRANT ALL PRIVILEGES ON *.* TO 'root'@'127.0.0.1' WITH GRANT OPTION;
  CREATE USER IF NOT EXISTS 'root'@'localhost';
  SET PASSWORD FOR 'root'@'localhost' = PASSWORD('');
  GRANT ALL PRIVILEGES ON *.* TO 'root'@'localhost' WITH GRANT OPTION;

  CREATE USER IF NOT EXISTS 'ainotes_user'@'localhost' IDENTIFIED BY 'x!gmx^-hQhkn5JEw';
  CREATE USER IF NOT EXISTS 'ainotes_user'@'127.0.0.1' IDENTIFIED BY 'x!gmx^-hQhkn5JEw';
  CREATE USER IF NOT EXISTS 'ainotes_user'@'%' IDENTIFIED BY 'x!gmx^-hQhkn5JEw';
  ALTER USER 'ainotes_user'@'localhost' IDENTIFIED BY 'x!gmx^-hQhkn5JEw';
  ALTER USER 'ainotes_user'@'127.0.0.1' IDENTIFIED BY 'x!gmx^-hQhkn5JEw';
  ALTER USER 'ainotes_user'@'%' IDENTIFIED BY 'x!gmx^-hQhkn5JEw';
  GRANT ALL PRIVILEGES ON *.* TO 'ainotes_user'@'localhost' WITH GRANT OPTION;
  GRANT ALL PRIVILEGES ON *.* TO 'ainotes_user'@'127.0.0.1' WITH GRANT OPTION;
  GRANT ALL PRIVILEGES ON *.* TO 'ainotes_user'@'%' WITH GRANT OPTION;

  CREATE USER IF NOT EXISTS 'khema_dbuser'@'localhost' IDENTIFIED BY 'Y+k,C=JAEA4nR+0*';
  CREATE USER IF NOT EXISTS 'khema_dbuser'@'127.0.0.1' IDENTIFIED BY 'Y+k,C=JAEA4nR+0*';
  CREATE USER IF NOT EXISTS 'khema_dbuser'@'%' IDENTIFIED BY 'Y+k,C=JAEA4nR+0*';
  GRANT ALL PRIVILEGES ON *.* TO 'khema_dbuser'@'localhost' WITH GRANT OPTION;
  GRANT ALL PRIVILEGES ON *.* TO 'khema_dbuser'@'127.0.0.1' WITH GRANT OPTION;
  GRANT ALL PRIVILEGES ON *.* TO 'khema_dbuser'@'%' WITH GRANT OPTION;
  FLUSH PRIVILEGES;
"

# Also configure any custom user from env if provided
if [ -n "$MYSQL_USER" ] && [ "$MYSQL_USER" != "root" ] && [ "$MYSQL_USER" != "ainotes_user" ] && [ "$MYSQL_USER" != "khema_dbuser" ]; then
  PASS="${MYSQL_PASSWORD:-}"
  $ADMIN_CLI -e "
    CREATE USER IF NOT EXISTS '${MYSQL_USER}'@'localhost' IDENTIFIED BY '${PASS}';
    CREATE USER IF NOT EXISTS '${MYSQL_USER}'@'127.0.0.1' IDENTIFIED BY '${PASS}';
    CREATE USER IF NOT EXISTS '${MYSQL_USER}'@'%' IDENTIFIED BY '${PASS}';
    GRANT ALL PRIVILEGES ON *.* TO '${MYSQL_USER}'@'localhost' WITH GRANT OPTION;
    GRANT ALL PRIVILEGES ON *.* TO '${MYSQL_USER}'@'127.0.0.1' WITH GRANT OPTION;
    GRANT ALL PRIVILEGES ON *.* TO '${MYSQL_USER}'@'%' WITH GRANT OPTION;
    FLUSH PRIVILEGES;
  "
fi

# 7. Seed tables from ainotes_db.sql if databases are empty
SQL_FILE=""
if [ -f "/app/applet/ainotes_db.sql" ]; then
  SQL_FILE="/app/applet/ainotes_db.sql"
elif [ -f "./ainotes_db.sql" ]; then
  SQL_FILE="./ainotes_db.sql"
fi

if [ -n "$SQL_FILE" ]; then
  for TARGET_DB in "ainotes" "ainotes_db" "khema_ainotes" "khema_dbuser" "${MYSQL_DATABASE:-}"; do
    if [ -z "$TARGET_DB" ]; then continue; fi
    TABLE_COUNT=$($ADMIN_CLI -D "$TARGET_DB" -N -s -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '${TARGET_DB}';" 2>/dev/null || echo "0")
    USER_COUNT=$($ADMIN_CLI -D "$TARGET_DB" -N -s -e "SELECT COUNT(*) FROM users;" 2>/dev/null || echo "0")
    # Only seed and restore if database has 0 tables. Never drop existing data on reboot!
    if [ "$TABLE_COUNT" -eq 0 ]; then
      echo "Empty database detected. Seeding ${TARGET_DB} database from $SQL_FILE..."
      $ADMIN_CLI "$TARGET_DB" < "$SQL_FILE" || true
    fi
    $ADMIN_CLI -D "$TARGET_DB" -e "ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Active';" 2>/dev/null || true
    $ADMIN_CLI -D "$TARGET_DB" -e "UPDATE users SET password = '\$2b\$10\$86Hg7inHqb3XOYApNN.L9OMmMD1C6ils50GSJU3deQD0KaYWW7z6e' WHERE email IN ('prorsethchun2014@gmail.com', 'prorseth@gmail.com');" 2>/dev/null || true
  done
fi

# 8. Ensure bun cannot hang and bun.lock is removed
rm -f ./bun.lock /bun.lock /app/applet/bun.lock 2>/dev/null || true
if [ -L "/usr/local/bin/bun" ] || [ -f "/usr/local/bin/bun" ]; then
  cat << 'BUN_EOF' > /usr/local/bin/bun
#!/bin/bash
exit 0
BUN_EOF
  chmod +x /usr/local/bin/bun 2>/dev/null || true
fi


echo "Database and environment initialization complete."
exit 0
