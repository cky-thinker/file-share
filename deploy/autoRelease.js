const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const readline = require('readline');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

const packagePath = path.resolve(__dirname, '..', 'electron', 'package.json');
const changelogDir = path.resolve(__dirname, '..', 'changelogs');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const versionRegex = /^v(\d+\.)?(\d+\.)?(\*|\d+)$/;

// 大模型配置，全部从环境变量读取
// LLM_API_KEY  必填，接口密钥
// LLM_BASE_URL 选填，OpenAI 兼容接口地址，默认 https://api.openai.com/v1
// LLM_MODEL    选填，模型名称，默认 gpt-4o-mini
const llmConfig = {
    apiKey: process.env.LLM_API_KEY,
    baseUrl: (process.env.LLM_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, ''),
    model: process.env.LLM_MODEL || 'gpt-4o-mini'
};

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

// 发送 JSON 请求，避免引入额外依赖
function requestJson(url, { method = 'POST', headers = {}, body } = {}) {
    return new Promise((resolve, reject) => {
        const parsed = new URL(url);
        const client = parsed.protocol === 'http:' ? http : https;
        const payload = body ? JSON.stringify(body) : null;
        const req = client.request({
            protocol: parsed.protocol,
            hostname: parsed.hostname,
            port: parsed.port,
            path: parsed.pathname + parsed.search,
            method,
            headers: {
                'Content-Type': 'application/json',
                ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
                ...headers
            }
        }, (res) => {
            let data = '';
            res.setEncoding('utf8');
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                if (res.statusCode < 200 || res.statusCode >= 300) {
                    return reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                }
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(new Error(`Invalid JSON response: ${data}`));
                }
            });
        });
        req.on('error', reject);
        if (payload) {
            req.write(payload);
        }
        req.end();
    });
}

// 获取距离 HEAD 最近的一个 tag，作为上一个发布版本
async function getLastTag() {
    try {
        const { stdout } = await execAsync('git describe --tags --abbrev=0');
        return stdout.trim();
    } catch (e) {
        return '';
    }
}

// 获取自上一个版本以来的提交记录与文件变更统计
async function getChangesSince(lastTag) {
    const range = lastTag ? `${lastTag}..HEAD` : 'HEAD';
    const { stdout: log } = await execAsync(`git log ${range} --oneline --no-merges`);
    let stat = '';
    try {
        const res = await execAsync(`git diff ${range} --stat`);
        stat = res.stdout.trim();
    } catch (e) {
        stat = '';
    }
    return { log: log.trim(), stat };
}

// 调用大模型对比总结版本更新内容
async function summarizeChanges({ version, lastTag, commits, stat }) {
    if (!llmConfig.apiKey) {
        throw new Error('缺少大模型配置，请设置环境变量 LLM_API_KEY（可选 LLM_BASE_URL、LLM_MODEL）');
    }

    const prompt = [
        `请根据以下信息，为版本 ${version} 撰写更新日志。`,
        '',
        `上一个版本：${lastTag || '无（首次发布）'}`,
        '',
        '提交记录：',
        commits || '（无提交记录）',
        '',
        '文件变更统计：',
        stat || '（无文件变更）',
        '',
        '要求：',
        `1. 使用中文 Markdown 输出，第一行为标题 "# ${version}"。`,
        '2. 按类型分组（如 新增 / 修复 / 优化 / 文档 / 其他），仅保留有内容的分组。',
        '3. 合并同类提交，剔除无意义提交（如 "代码调整"），语言简洁、面向用户。',
        '4. 不要输出任何额外说明、前言或代码块标记。'
    ].join('\n');

    const data = await requestJson(`${llmConfig.baseUrl}/chat/completions`, {
        headers: { Authorization: `Bearer ${llmConfig.apiKey}` },
        body: {
            model: llmConfig.model,
            temperature: 0.2,
            messages: [
                { role: 'system', content: '你是一名专业的软件发布工程师，擅长根据 git 提交记录撰写简洁、准确的中文版本更新日志。' },
                { role: 'user', content: prompt }
            ]
        }
    });

    const content = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (!content) {
        throw new Error(`大模型返回内容为空: ${JSON.stringify(data)}`);
    }
    return content.trim();
}

async function main() {
    console.log('Recent git tag:');
    try {
        const { stdout } = await execAsync('git tag -l --sort=v:refname');
        const lines = stdout.split('\n').map(line => line.trim()).filter(Boolean);
        lines.slice(-5).forEach(line => console.log(line));
    } catch (e) {
        console.error(`Error echo recent tag: ${e.message}`);
    }

    const newVersion = (await question('Enter the new version (must follow semantic versioning e.g., v1.0.0): ')).trim();
    if (!versionRegex.test(newVersion)) {
        throw new Error('Version format is invalid. Please follow semantic versioning (e.g., 1.0.0).');
    }

    // 1. 调用大模型对比总结更新内容，写入 changelogs/<version>.md
    const lastTag = await getLastTag();
    console.log(`Generating changelog since ${lastTag || '(beginning)'} ...`);
    const { log, stat } = await getChangesSince(lastTag);
    const changelog = await summarizeChanges({ version: newVersion, lastTag, commits: log, stat });

    fs.mkdirSync(changelogDir, { recursive: true });
    const changelogPath = path.join(changelogDir, `${newVersion}.md`);
    fs.writeFileSync(changelogPath, changelog.endsWith('\n') ? changelog : `${changelog}\n`, 'utf8');
    console.log(`Changelog written to ${changelogPath}`);

    // 2. 更新 electron/package.json 版本号
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    packageJson.version = newVersion;
    fs.writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`, 'utf8');
    console.log(`package.json version updated to ${newVersion}`);

    // 3. 提交版本号与 changelog
    await execAsync(`git add "${packagePath}" "${changelogPath}" && git commit -m "Update version to ${newVersion}"`);
    console.log('Git commit for version update created');

    // 4. 打标签并推送，触发 GitHub Actions 发布
    await execAsync(`git tag ${newVersion}`);
    console.log(`Git tag ${newVersion} added`);

    await execAsync('git push && git push --all');
    console.log(`Changes and tag ${newVersion} pushed to remote`);
}

main()
    .catch(err => {
        console.error(`Error: ${err.message}`);
        process.exitCode = 1;
    })
    .finally(() => rl.close());
