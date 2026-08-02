#!/bin/zsh
set -e

project_dir="/Users/yyh/Documents/雅思"
cd "$project_dir"

echo "1/2 配置 OpenAI API Key（输入不会显示）"
npx wrangler secret put OPENAI_API_KEY

echo "2/2 配置网页访问口令（请自定义一个较长口令，并记住它）"
npx wrangler secret put APP_ACCESS_TOKEN

echo "配置完成。打开在线网页，在“设置备份”中填写同一个网页访问口令。"
