const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const inquirer = require('inquirer');

// 获取当前环境
const mode = process.env.NODE_ENV || "development";

// manifest 路径
const manifestPath = path.join(__dirname, "../src/manifest.json");
const backupPath = path.join(__dirname, "../src/manifest.backup.json");

// 定义问题列表
const questions = [
  {
    type: 'input',
    name: 'VITE_APP_NAME',
    message: '请输入应用名称:',
    default: process.env.VITE_APP_NAME || ''
  },
  {
    type: 'input',
    name: 'VITE_APP_ID',
    message: '请输入应用ID:',
    default: process.env.VITE_APP_ID || ''
  },
  {
    type: 'input',
    name: 'VITE_WEIXIN_APPID',
    message: '请输入微信小程序AppID:',
    default: process.env.VITE_WEIXIN_APPID || ''
  },
  {
    type: 'list',
    name: 'VITE_ENV',
    message: '请选择环境:',
    choices: ['dev', 'staging', 'prod'],
    default: process.env.VITE_ENV || 'dev'
  },
  {
    type: 'input',
    name: 'VITE_ANDROID_KEYSTORE',
    message: '请输入Android签名文件名:',
    default: process.env.VITE_ANDROID_KEYSTORE || 'android.keystore'
  },
  {
    type: 'password',
    name: 'VITE_ANDROID_KEYSTORE_PASSWORD',
    message: '请输入Android签名文件密码:',
    default: process.env.VITE_ANDROID_KEYSTORE_PASSWORD || ''
  },
  {
    type: 'input',
    name: 'VITE_ANDROID_ALIAS',
    message: '请输入Android签名别名:',
    default: process.env.VITE_ANDROID_ALIAS || ''
  },
  {
    type: 'password',
    name: 'VITE_ANDROID_ALIAS_PASSWORD',
    message: '请输入Android签名别名密码:',
    default: process.env.VITE_ANDROID_ALIAS_PASSWORD || ''
  }
];

async function main() {
  try {
    // 加载环境变量
    const envPath = path.resolve(process.cwd(), `./src/.env.${mode}`);
    const envConfig = dotenv.config({ path: envPath });
    
    if (envConfig.error) {
      console.warn(`警告: 无法加载环境文件: ${envPath}`);
    }

    // 备份原始文件
    if (!fs.existsSync(backupPath)) {
      fs.copyFileSync(manifestPath, backupPath);
      console.log("✅ manifest.json 已备份");
    }

    // 获取用户输入
    const answers = await inquirer.prompt(questions);
    
    // 读取 manifest.json
    let manifest = fs.readFileSync(manifestPath, "utf8");

    // 替换环境变量
    Object.entries(answers).forEach(([key, value]) => {
      if (!value && key !== 'VITE_ENV') {  // VITE_ENV 允许为空，使用默认值
        throw new Error(`配置项 ${key} 不能为空`);
      }
      manifest = manifest.replace(new RegExp(`%${key}%`, "g"), value);
      // 同时更新到 process.env，以便其他地方使用
      process.env[key] = value;
    });

    // 写入更新后的 manifest.json
    fs.writeFileSync(manifestPath, manifest);
    console.log(`✅ manifest.json 已更新，当前环境: ${mode}`);

    // 是否要保存配置到环境文件
    const { shouldSave } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'shouldSave',
        message: '是否要保存这些配置到环境文件?',
        default: false
      }
    ]);

    if (shouldSave) {
      let envContent = '';
      Object.entries(answers).forEach(([key, value]) => {
        envContent += `${key}=${value}\n`;
      });
      fs.writeFileSync(envPath, envContent);
      console.log(`✅ 配置已保存到: ${envPath}`);
    }

  } catch (error) {
    console.error('错误:', error.message);
    process.exit(1);
  }
}

// 执行主函数
main();

// 注册进程退出时的处理函数
process.on('exit', () => {
  // 恢复备份文件
  if (fs.existsSync(backupPath)) {
    fs.copyFileSync(backupPath, manifestPath);
    console.log("✅ manifest.json 已恢复");
    // 删除备份文件
    fs.unlinkSync(backupPath);
    console.log("✅ manifest.backup.json 已删除");
  }
});

// 处理意外退出的情况
process.on('SIGINT', () => {
  process.exit();
});

process.on('SIGTERM', () => {
  process.exit();
});

process.on('uncaughtException', (err) => {
  console.error('未捕获的异常:', err);
  process.exit(1);
});
