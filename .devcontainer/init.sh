#!/bin/bash
set -e

echo "🚀 Dev Container初期化を開始します..."

# pnpm installを実行
echo "📦 依存関係をインストールしています..."
pnpm install
echo "✅ 依存関係のインストールが完了しました"

echo "🎉 Dev Containerの初期化が完了しました！"
