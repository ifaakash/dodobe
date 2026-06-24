#!/bin/bash

echo "––– Building image for local registry –––"
docker build -t localhost:5000/dodo-backend -f Dockerfile .

echo "––– BUILD COMPLETED –––"
