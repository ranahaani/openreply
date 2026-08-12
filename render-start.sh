#!/usr/bin/env sh
# Render free web service: run the BullMQ worker in the background and the
# Next.js server in the foreground (exec so signals reach next start / $PORT).
npm run worker &
exec npm run start
