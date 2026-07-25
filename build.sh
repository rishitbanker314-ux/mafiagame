#!/bin/bash

# Exit on any error
set -e

echo "Installing backend dependencies..."
cd server
npm install

echo "Installing frontend dependencies..."
cd ../client
npm install

echo "Building frontend..."
npm run build

echo "Build complete!"
