#!/bin/bash

echo "Starting OpenRift Analytics Backend..."
echo ""

python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
