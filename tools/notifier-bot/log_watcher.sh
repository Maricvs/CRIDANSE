#!/bin/bash

SERVICE_NAME="unlim_backend.service"
TELEGRAM_SCRIPT="/var/www/unlim-mind-ai/tools/notifier-bot/telegram.py"

journalctl -fu "$SERVICE_NAME" | while read line; do
  if echo "$line" | grep -qE "Traceback|Exception|ERROR|status=1/FAILURE"; then
    /usr/bin/python3 "$TELEGRAM_SCRIPT" "🚨 [Unlim Backend] $line"
  fi
done