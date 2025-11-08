#!/bin/bash
# 애플리케이션 환경변수를 위한 Secret 생성
# deployment.yaml에서 참조되는 DB 및 JWT 설정

kubectl create secret generic amori-secrets \
  --from-literal=db-host='34.41.85.255' \
  --from-literal=db-user='dev' \
  --from-literal=db-password='Dev1010!!' \
  --from-literal=db-name='amori' \
  --from-literal=jwt-secret-key='amori-secret-key-change-this-in-production-2024' \
  --from-literal=google-maps-api-key='AIzaSyCLVvVUxsL7pJ2byDfAt6ytRw9xjkl2B50' \
  --dry-run=client -o yaml | kubectl apply -f -

echo "✅ Kubernetes Secret 'amori-secrets' 생성 완료"