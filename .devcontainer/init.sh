#!/bin/bash
set -e

echo "🚀 Dev Container初期化を開始します..."

# データベースの起動を待つ
echo "⏳ データベースの起動を待っています..."
max_attempts=30
attempt=0
while ! pg_isready -h localhost -p 26257 -U root > /dev/null 2>&1; do
    attempt=$((attempt + 1))
    if [ $attempt -ge $max_attempts ]; then
        echo "❌ データベースの起動がタイムアウトしました"
        exit 1
    fi
    echo "  待機中... ($attempt/$max_attempts)"
    sleep 2
done
echo "✅ データベースが起動しました"

# pnpm installを実行
echo "📦 依存関係をインストールしています..."
pnpm install
echo "✅ 依存関係のインストールが完了しました"

# Prismaクライアントを生成
echo "🔧 Prismaクライアントを生成しています..."
pnpm prisma generate
echo "✅ Prismaクライアントの生成が完了しました"

# データベーススキーマをpush
echo "🗄️  データベーススキーマをpushしています..."
pnpm prisma db push --skip-generate
echo "✅ データベーススキーマのpushが完了しました"

# seedデータがあれば投入
if [ -f "prisma/seed-admin.ts" ]; then
    echo "🌱 seedデータを投入しています..."
    pnpm prisma db seed || echo "⚠️  seedの実行に失敗しました（既にデータが存在する可能性があります）"
    echo "✅ seedデータの投入が完了しました"
fi

echo "🎉 Dev Containerの初期化が完了しました！"

