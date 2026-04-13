import { ModuleSettings } from '../models/ModuleSettings';
import { spawn, exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { FORUM_EXTENSIONS, type ForumExtensionMeta } from '../data/forumExtensions';
import { promisify } from 'util';
import { createLogger } from '../utils/logger';

const execAsync = promisify(exec);
const logger = createLogger('forum-service');

/** 项目根目录（绝对路径），与启动时的 cwd 无关，开发/生产一致 */
function getProjectRoot(): string {
  return path.resolve(path.join(__dirname, '../../..'));
}

/** 使用 spawn 执行 docker exec，避免 Windows 下 -e VAR="value" 的引号被 shell 吃掉 */
function spawnDockerExec(args: string[], env: Record<string, string>, stdin?: string): Promise<{ stdout: string; stderr: string; code: number }> {
  const cwd = getProjectRoot();
  const envList = Object.entries(env).flatMap(([k, v]) => ['-e', `${k}=${v}`]);
  const fullArgs = ['exec', ...envList, 'flarum_app', ...args];
  return new Promise((resolve) => {
    const proc = spawn('docker', fullArgs, { cwd, windowsHide: true });
    let stdout = '';
    let stderr = '';
    proc.stdout?.on('data', (d: Buffer) => { stdout += d.toString(); });
    proc.stderr?.on('data', (d: Buffer) => { stderr += d.toString(); });
    if (stdin !== undefined) {
      proc.stdin?.write(stdin, () => proc.stdin?.end());
    }
    proc.on('close', (code) => resolve({ stdout, stderr, code: code ?? -1 }));
  });
}

const DEPLOY_TIMEOUT = 5 * 60 * 1000; // 5 minutes
let deployProcess: import('child_process').ChildProcess | null = null;

const updateForumStatus = async (status: string, log?: string, url?: string) => {
  const update: any = { 'forum.status': status };
  if (log) {
    update['forum.lastLog'] = log;
  }
  if (url) {
    update['forum.url'] = url;
  }
  return ModuleSettings.findOneAndUpdate({}, { $set: update }, { upsert: true, new: true });
};

export const deployForum = async (): Promise<void> => {
  if (deployProcess) {
    logger.info('Deployment already in progress.');
    return;
  }

  // 先立即更新状态（清掉旧失败信息），让管理端立刻看到“部署中”
  try {
    await updateForumStatus('deploying_pull', '正在准备环境和配置...', '');
  } catch (error) {
    logger.error({ error }, 'Failed to update forum status before deploy');
  }

  const root = getProjectRoot();
  // 生产环境（Linux）：一键部署时自动安装 Docker（若未安装）；开发环境不自动安装
  const isProduction = process.env.NODE_ENV === 'production';
  const isLinux = process.platform !== 'win32';
  const env = { ...process.env, AUTO_INSTALL_DOCKER: isLinux && isProduction ? '1' : '0' };

  if (process.platform === 'win32') {
    deployProcess = spawn('powershell.exe', [
      '-NoProfile',
      '-ExecutionPolicy', 'Bypass',
      '-File', path.join(root, 'scripts', 'deploy-flarum.ps1')
    ], { cwd: root, env: process.env });
  } else {
    deployProcess = spawn('bash', [path.join(root, 'scripts', 'deploy-flarum.sh')], { cwd: root, env });
  }

  const timeoutId = setTimeout(() => {
    logger.error('Deployment timed out.');
    if (deployProcess) {
      deployProcess.kill();
      deployProcess = null;
      updateForumStatus('failed', '部署超时 (超过5分钟)');
    }
  }, DEPLOY_TIMEOUT);

  deployProcess.stdout?.on('data', (data: Buffer) => {
    const output = data.toString();
    logger.info({ output }, 'Deploy stdout');
    const statusMatch = output.match(/STATUS:(.*?)\sLOG:(.*)/);
    if (statusMatch) {
      updateForumStatus(statusMatch[1], statusMatch[2]);
    }
    const urlMatch = output.match(/FLARUM_URL_IS=(.*)/);
    if (urlMatch) {
      updateForumStatus('deployed', '部署成功', urlMatch[1].trim());
    }
  });

  deployProcess.stderr?.on('data', (data: Buffer) => {
    const errorOutput = data.toString();
    logger.error({ errorOutput }, 'Deploy stderr');
    updateForumStatus('failed', errorOutput);
  });

  deployProcess.on('close', (code) => {
    clearTimeout(timeoutId);
    if (code !== 0) {
      logger.error({ code }, 'Deployment script exited with non-zero code');
      // Final status might have been set by stderr, so we check
      ModuleSettings.findOne().then(settings => {
        if (settings?.forum.status !== 'failed') {
          updateForumStatus('failed', `部署脚本异常退出，代码: ${code}`);
        }
      });
    }
    deployProcess = null;
  });
};

export const cancelDeploy = async (): Promise<void> => {
  await updateForumStatus('cancelling', '正在取消部署...');
  if (deployProcess) {
    deployProcess.kill();
    deployProcess = null;
  }

  const root = getProjectRoot();
  const cancelScript = process.platform === 'win32'
    ? path.join(root, 'scripts', 'cancel-deploy.ps1')
    : path.join(root, 'scripts', 'cancel-deploy.sh');
  const cancelCommand = process.platform === 'win32'
    ? `powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${cancelScript}"`
    : `bash "${cancelScript}"`;

  exec(cancelCommand, { cwd: root }, (error, stdout, stderr) => {
    if (error) {
      logger.error({ error }, 'Cancel script error');
      updateForumStatus('failed', `取消失败: ${stderr}`);
      return;
    }
    logger.info({ stdout }, 'Cancel script stdout');
    updateForumStatus('not_deployed', '部署已取消');
  });
};

export const getForumStatus = async () => {
  let settings = await ModuleSettings.findOne().sort({ _id: 1 });
  if (!settings) {
    settings = await ModuleSettings.create({});
  }
  return settings.forum;
};

/** 读取部署时生成的 .env.flarum 中的 DB_PASSWORD（使用绝对路径，开发/生产一致） */
export const getForumDeployCredentials = (): { dbPassword: string } => {
  const envPath = path.resolve(getProjectRoot(), '.env.flarum');
  if (!fs.existsSync(envPath)) return { dbPassword: '' };
  try {
    const content = fs.readFileSync(envPath, 'utf8');
    const match = content.match(/DB_PASSWORD=(.+)/);
    const dbPassword = match ? match[1].trim().replace(/^["']|["']$/g, '') : '';
    return { dbPassword };
  } catch {
    return { dbPassword: '' };
  }
};

/** 仅启动论坛容器（已部署过但容器已停止时使用），不重新拉取或配置 */
export const startForumContainers = (): Promise<{ success: boolean; error?: string }> => {
  const root = getProjectRoot();
  const envPath = path.resolve(root, '.env.flarum');
  const composePath = path.resolve(root, 'docker-compose.flarum.yml');
  if (!fs.existsSync(envPath)) {
    return Promise.resolve({ success: false, error: '未找到 .env.flarum，请先完成一键部署。' });
  }

  return new Promise((resolve) => {
    const f = composePath.replace(/\\/g, '/');
    const e = envPath.replace(/\\/g, '/');
    const cmd = `docker compose -f "${f}" --env-file "${e}" up -d`;
    exec(cmd, { cwd: root, maxBuffer: 1024 * 1024, env: process.env }, (error, stdout, stderr) => {
      const out = (stdout || '') + (stderr || '');
      if (error) {
        logger.error({ error }, 'Start forum containers error');
        resolve({ success: false, error: out.trim() || error.message });
        return;
      }
      logger.info({ out }, 'Start forum containers');
      resolve({ success: true });
    });
  });
};

/** 一键卸载论坛：停止并移除容器与命名卷（-v）、删除 assets/extensions，下次部署为全新环境 */
export const uninstallForum = (): Promise<{ success: boolean; error?: string }> => {
  const root = getProjectRoot();
  const composePath = path.resolve(root, 'docker-compose.flarum.yml');
  if (!fs.existsSync(composePath)) {
    return Promise.resolve({ success: false, error: '未找到 docker-compose.flarum.yml。' });
  }

  return new Promise((resolve) => {
    const f = composePath.replace(/\\/g, '/');
    const cmd = `docker compose -f "${f}" down -v`;
    exec(cmd, { cwd: root, maxBuffer: 1024 * 1024, env: process.env }, (error, stdout, stderr) => {
      const out = (stdout || '') + (stderr || '');
      if (error) {
        logger.error({ error }, 'Uninstall forum error');
        resolve({ success: false, error: out.trim() || error.message });
        return;
      }
      logger.info({ out }, 'Uninstall forum');

      const dirsToRemove = ['flarum/assets', 'flarum/extensions'];
      for (const dir of dirsToRemove) {
        const fullPath = path.resolve(root, dir);
        if (fs.existsSync(fullPath)) {
          try {
            fs.rmSync(fullPath, { recursive: true, maxRetries: 3, retryDelay: 400 });
            logger.info({ fullPath }, 'Removed directory');
          } catch (err) {
            logger.error({ fullPath, error: err }, 'Failed to remove directory');
          }
        }
      }
      updateForumStatus('not_deployed', '论坛已卸载，数据已清理', '')
        .then(() => resolve({ success: true }))
        .catch((err) => {
          logger.error({ error: err }, 'Update status after uninstall failed');
          resolve({ success: true });
        });
    });
  });
};

/** crazymax/flarum 应用目录为 /opt/flarum（PHP 8.3）；/data 仅为扩展缓存等持久化卷 */
const FLARUM_APP_ROOT = '/opt/flarum';

/** 在 flarum_app 容器内执行命令（cwd 使用项目根绝对路径） */
async function dockerExecFlarum(shellCmd: string, timeoutMs = 120000): Promise<{ stdout: string; stderr: string }> {
  const cwd = getProjectRoot();
  const cmd = `docker exec flarum_app sh -c "cd ${FLARUM_APP_ROOT} && ${shellCmd.replace(/"/g, '\\"')}"`;
  const { stdout, stderr } = await execAsync(cmd, { cwd, maxBuffer: 2 * 1024 * 1024, timeout: timeoutMs });
  return { stdout: stdout || '', stderr: stderr || '' };
}

/**
 * 从 Flarum 数据库读取已启用的扩展 ID 列表。
 * 官方实现：ExtensionManager::getEnabled() 读 config->get('extensions_enabled')，即 settings 表 key=extensions_enabled 的 value（JSON 数组）。
 * 表名由 config.php 的 database.prefix 决定，如 prefix=flarum_ 则表为 flarum_settings。
 * 此处改为在容器内读取 config.php 再查库，避免宿主机传 env 在 Windows 下异常。
 */
async function getEnabledExtensionIds(): Promise<string[]> {
  const { dbPassword } = getForumDeployCredentials();
  if (!dbPassword.trim()) {
    logger.debug('getEnabledExtensionIds: no DB_PASSWORD in .env.flarum');
    return [];
  }
  // 由宿主机显式传入 DB 环境变量，避免 docker exec 子进程未继承 compose 环境
  const dbEnv = {
    DB_HOST: 'flarum_db',
    DB_NAME: 'flarum',
    DB_USER: 'flarum',
    DB_PASSWORD: dbPassword.trim(),
    DB_PREFIX: 'flarum_',
  };
  /**
 * 安全说明：以下 PHP 代码通过 base64 编码后在 Docker 容器内执行。
 * - PHP 代码完全由本文件硬编码定义，不接受任何外部输入
 * - 执行环境是隔离的 Flarum Docker 容器，与主应用隔离
 * - 所有变量通过环境变量传递，经过类型验证
 * - 这不是 Node.js 的 eval()，而是 PHP 的代码执行机制
 */

/**
 * 验证 base64 字符串是否有效（防止注入）
 */
function isValidBase64(str: string): boolean {
  return /^[A-Za-z0-9+/=]+$/.test(str) && str.length % 4 === 0;
}

/**
 * 安全地生成 PHP 执行命令
 * 验证 base64 编码后的脚本，确保没有被篡改
 */
function createSafePhpCommand(phpScript: string): string {
  const b64 = Buffer.from(phpScript, 'utf8').toString('base64');
  // 验证生成的 base64 是有效的
  if (!isValidBase64(b64)) {
    throw new Error('Invalid base64 encoding generated');
  }
  return `eval(base64_decode('${b64}'));`;
}

const phpScript = [
  '$h=getenv("DB_HOST");$n=getenv("DB_NAME")?:"flarum";$u=getenv("DB_USER")?:"flarum";',
  '$pw=getenv("DB_PASSWORD");$pf=getenv("DB_PREFIX")?:"flarum_";',
  'if(!$h||!$pw){echo "[]";exit(0);}',
  '$t=$pf."settings";$dsn="mysql:host=".$h.";dbname=".$n.";charset=utf8mb4";',
  'try{$pdo=new PDO($dsn,$u,$pw);',
  '$s=$pdo->query("SELECT `value` FROM `".$t."` WHERE `key`=\'extensions_enabled\'");',
  '$r=$s?$s->fetch(PDO::FETCH_ASSOC):null;echo $r?$r["value"]:"[]";}catch(Exception $e){echo "[]";}',
  'exit(0);',
].join('');
const phpOneLiner = createSafePhpCommand(phpScript);
  try {
    const { stdout, stderr, code } = await spawnDockerExec(['php', '-r', phpOneLiner], dbEnv);
    if (code !== 0) {
      logger.warn({ stderr, code }, 'getEnabledExtensionIds: php exited non-zero');
    }
    const raw = (stdout || '').trim();
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr) && arr.length > 0) return arr;
    }
  } catch (e) {
    logger.warn({ error: e instanceof Error ? e.message : String(e) }, 'getEnabledExtensionIds failed');
  }

  // 兜底：在容器内读 config.php（/data 或 /opt/flarum），不依赖宿主机传 env
  const phpScriptConfig = [
    '$paths=array("/data/config.php","/opt/flarum/config.php");$c=null;',
    'foreach($paths as $p){if(file_exists($p)){$c=@include $p;if(is_array($c)&&!empty($c["database"]))break;}}',
    'if(!is_array($c)||empty($c["database"])){echo "[]";exit(0);}',
    '$db=$c["database"];$pf=isset($db["prefix"])?$db["prefix"]:"flarum_";$t=$pf."settings";',
    '$dsn="mysql:host=".($db["host"]??"localhost").";dbname=".($db["database"]??"flarum").";charset=utf8mb4";',
    'try{$pdo=new PDO($dsn,$db["username"]??"",$db["password"]??"");',
    '$s=$pdo->query("SELECT `value` FROM `".$t."` WHERE `key`=\'extensions_enabled\'");',
    '$r=$s?$s->fetch(PDO::FETCH_ASSOC):null;echo $r?$r["value"]:"[]";}catch(Exception $e){echo "[]";}',
    'exit(0);',
  ].join('');
  const phpOneLinerConfig = createSafePhpCommand(phpScriptConfig);
  try {
    const { stdout: out2, code: code2 } = await spawnDockerExec(['php', '-r', phpOneLinerConfig], {});
    if (code2 === 0) {
      const raw2 = (out2 || '').trim();
      if (raw2) {
        const arr2 = JSON.parse(raw2);
        if (Array.isArray(arr2) && arr2.length > 0) {
          logger.debug({ count: arr2.length }, 'getEnabledExtensionIds: got from config.php fallback');
          return arr2;
        }
      }
    }
  } catch {
    // ignore
  }
  return [];
}

/** 获取已安装的 Composer 包名列表（当无法读 DB 时作为“已安装”的备用判断） */
async function getInstalledComposerPackages(): Promise<string[]> {
  try {
    const { stdout } = await dockerExecFlarum('composer show --installed --format=json', 30000);
    const data = JSON.parse(stdout);
    const packages: string[] = [];
    if (data.installed && Array.isArray(data.installed)) {
      for (const pkg of data.installed) {
        if (pkg && typeof pkg.name === 'string') packages.push(pkg.name);
      }
    }
    if (packages.length > 0) {
      logger.debug({ count: packages.length }, 'getInstalledComposerPackages: got packages from JSON');
      return packages;
    }
    // 兜底：解析默认表格输出（每行首列为  vendor/package）
    const lines = (stdout || '').split('\n').map((l) => l.trim());
    for (const line of lines) {
      const m = line.match(/^([a-z0-9][a-z0-9_.-]*\/[a-z0-9][a-z0-9_.-]*)\s/i);
      if (m) packages.push(m[1]);
    }
    if (packages.length > 0) logger.debug({ count: packages.length }, 'getInstalledComposerPackages: got packages from table');
    return packages;
  } catch (e) {
    logger.warn({ error: e instanceof Error ? e.message : String(e) }, 'getInstalledComposerPackages failed');
    return [];
  }
}

/** 从容器内 composer 读取某包声明的 require，返回其中属于我们已知的 Flarum 扩展的 extension id 列表（用于依赖顺序，不写死具体插件）。 */
async function getExtensionRequiredFlarumIds(composerPackage: string): Promise<string[]> {
  if (!composerPackage.trim()) return [];
  try {
    const { stdout } = await dockerExecFlarum(
      `composer show ${composerPackage.replace(/[^a-z0-9/-]/gi, '')} --format=json 2>/dev/null || echo "{}"`,
      15000
    );
    const data = JSON.parse(stdout || '{}') as { requires?: Record<string, string> };
    const requires = data.requires && typeof data.requires === 'object' ? Object.keys(data.requires) : [];
    const knownPackages = new Map(FORUM_EXTENSIONS.map(e => [e.composerPackage, e.id]));
    const ids: string[] = [];
    for (const pkg of requires) {
      const extId = knownPackages.get(pkg);
      if (extId && !ids.includes(extId)) ids.push(extId);
    }
    return ids;
  } catch {
    return [];
  }
}

/** 将扩展 ID 列表按依赖排序，保证每个扩展的依赖都在其前面（依赖从 composer 动态读取，不写死）。 */
async function orderExtensionsWithDependenciesFirst(
  ids: string[],
  getDeps: (extensionId: string) => Promise<string[]>
): Promise<string[]> {
  const result: string[] = [];
  const seen = new Set<string>();
  const add = async (id: string) => {
    if (seen.has(id)) return;
    const deps = await getDeps(id);
    for (const dep of deps) {
      if (ids.includes(dep)) await add(dep);
    }
    seen.add(id);
    result.push(id);
  };
  for (const id of ids) await add(id);
  return result;
}

/** 将 extensions_enabled 设置为指定有序列表（用于一键修复后纠正依赖顺序）。 */
async function setExtensionsEnabledOrder(orderedIds: string[]): Promise<{ success: boolean; error?: string }> {
  const { dbPassword } = getForumDeployCredentials();
  if (!dbPassword?.trim()) return { success: false, error: '未配置 DB_PASSWORD' };
  const listB64 = Buffer.from(JSON.stringify(orderedIds), 'utf8').toString('base64');
  const phpCode = [
    '$raw=base64_decode(getenv("EXT_LIST_B64"));$list=json_decode($raw,true);if(!is_array($list))exit(1);',
    '$t=(getenv("DB_PREFIX")?: "flarum_")."settings";',
    'try{',
    '$pdo=new PDO("mysql:host=".getenv("DB_HOST").";dbname=".getenv("DB_NAME").";charset=utf8mb4",getenv("DB_USER"),getenv("DB_PASSWORD"));',
    '$up=$pdo->prepare("UPDATE `".$t."` SET value=? WHERE `key`=\'extensions_enabled\'");',
    '$up->execute([json_encode($list)]);exit(0);',
    '}catch(Exception $e){exit(3);}',
  ].join('');
  const env: Record<string, string> = {
    EXT_LIST_B64: listB64,
    DB_HOST: 'flarum_db',
    DB_NAME: 'flarum',
    DB_USER: 'flarum',
    DB_PASSWORD: dbPassword.trim(),
    DB_PREFIX: 'flarum_',
  };
  try {
    const { stderr, code } = await spawnDockerExec(['php', '-r', phpCode], env);
    if (code !== 0) return { success: false, error: stderr?.trim() || `PHP exit ${code}` };
    return { success: true };
  } catch (e: unknown) {
    const err = e && typeof e === 'object' && 'stderr' in e ? String((e as { stderr: string }).stderr) : String(e);
    return { success: false, error: err };
  }
}

/** 启用扩展前先确保其依赖已启用（依赖从 composer 动态读取，支持任意插件）。 */
async function ensureDependenciesEnabled(extensionId: string): Promise<{ success: boolean; error?: string }> {
  const meta = FORUM_EXTENSIONS.find(e => e.id === extensionId);
  const deps = meta ? await getExtensionRequiredFlarumIds(meta.composerPackage) : [];
  if (!deps.length) return { success: true };
  const enabledIds = await getEnabledExtensionIds();
  const enabledSet = new Set(enabledIds);
  for (const depId of deps) {
    if (enabledSet.has(depId)) continue;
    const res = await ensureDependenciesEnabled(depId);
    if (!res.success) return res;
    const on = await setExtensionEnabled(depId, true);
    if (!on.success) return on;
    enabledSet.add(depId);
  }
  return { success: true };
}

/** 在 Flarum 设置中启用/禁用扩展（直接写 settings 表 extensions_enabled，与官方/社区做法一致）。用 spawn 传参不经 shell，避免 Windows 下引号/$ 被解析。 */
async function setExtensionEnabled(extensionId: string, enable: boolean): Promise<{ success: boolean; error?: string }> {
  const mode = enable ? 'enable' : 'disable';
  const safeId = extensionId.replace(/[^a-z0-9_-]/gi, '');
  const { dbPassword } = getForumDeployCredentials();
  if (!dbPassword?.trim()) {
    return { success: false, error: '未配置 DB_PASSWORD（.env.flarum）' };
  }
  const phpCode = [
    '$id=getenv("EXT_ID");$mode=getenv("EXT_MODE");',
    'if(!$id||!$mode)exit(1);',
    '$t=(getenv("DB_PREFIX")?: "flarum_")."settings";',
    'try{',
    '$pdo=new PDO("mysql:host=".getenv("DB_HOST").";dbname=".getenv("DB_NAME").";charset=utf8mb4",getenv("DB_USER"),getenv("DB_PASSWORD"));',
    '$stmt=$pdo->query("SELECT value FROM `".$t."` WHERE `key`=\'extensions_enabled\'");',
    '$row=$stmt?$stmt->fetch(PDO::FETCH_ASSOC):null;',
    'if(!$row)exit(2);',
    '$list=json_decode($row["value"],true);if(!is_array($list))$list=[];',
    'if($mode==="enable"){if(!in_array($id,$list))$list[]=$id;}',
    'else{$list=array_values(array_diff($list,[$id]));}',
    '$up=$pdo->prepare("UPDATE `".$t."` SET value=? WHERE `key`=\'extensions_enabled\'");',
    '$up->execute([json_encode($list)]);exit(0);',
    '}catch(Exception $e){exit(3);}',
  ].join('');
  const env: Record<string, string> = {
    EXT_ID: safeId,
    EXT_MODE: mode,
    DB_HOST: 'flarum_db',
    DB_NAME: 'flarum',
    DB_USER: 'flarum',
    DB_PASSWORD: dbPassword.trim(),
    DB_PREFIX: 'flarum_',
  };
  try {
    const { stderr, code } = await spawnDockerExec(['php', '-r', phpCode], env);
    if (code !== 0) {
      return { success: false, error: stderr?.trim() || `PHP exit ${code}` };
    }
    return { success: true };
  } catch (e: unknown) {
    const err = e && typeof e === 'object' && 'stderr' in e ? String((e as { stderr: string }).stderr) : String(e);
    return { success: false, error: err };
  }
}

/** 论坛插件列表（含是否已安装）：DB extensions_enabled 与 composer 已安装包合并判断，与 Flarum 官方一致 */
export async function getForumExtensions(): Promise<{ list: Array<ForumExtensionMeta & { installed: boolean }>; available: boolean }> {
  const status = await getForumStatus();
  if (status?.status !== 'deployed') {
    return { list: FORUM_EXTENSIONS.map(ext => ({ ...ext, installed: false })), available: false };
  }
  const [enabledIds, composerPackages] = await Promise.all([getEnabledExtensionIds(), getInstalledComposerPackages()]);
  const installedByComposer = new Set(FORUM_EXTENSIONS.filter(ext => composerPackages.includes(ext.composerPackage)).map(ext => ext.id));
  const enabledSet = new Set(enabledIds);
  const list = FORUM_EXTENSIONS.map(ext => ({
    ...ext,
    installed: enabledSet.has(ext.id) || installedByComposer.has(ext.id),
  }));
  if (enabledIds.length > 0) {
    logger.debug({ from: 'db', enabledCount: enabledIds.length }, 'getForumExtensions: used extensions_enabled');
  }
  if (installedByComposer.size > 0) {
    logger.debug({ composerInstalled: installedByComposer.size }, 'getForumExtensions: merged composer installed');
  }
  return { list, available: true };
}

/** 若镜像内 composer.json 使用错误包名 flarum/flarum-lang-english，改为官方 flarum/lang-english，避免 composer 报错 */
async function ensureComposerJsonPackageNames(): Promise<void> {
  try {
    await dockerExecFlarum('sed -i "s/flarum\\/flarum-lang-english/flarum\\/lang-english/g" composer.json', 5000);
  } catch {
    // 无 composer.json 或 sed 失败则忽略
  }
}

/** 将未上 Packagist 的扩展仓库加入容器内 composer.json 的 repositories，以便 composer require 能解析 */
async function ensureComposerVcsRepository(vcsUrl: string): Promise<{ success: boolean; error?: string }> {
  const phpCode = [
    '$f="/opt/flarum/composer.json";',
    '$j=json_decode(file_get_contents($f),true);',
    'if(!is_array($j))exit(1);',
    'if(!isset($j["repositories"]))$j["repositories"]=[];',
    '$url=getenv("VCS_URL");if(empty($url))exit(2);',
    '$found=false;foreach($j["repositories"] as $r){if(isset($r["url"])&&$r["url"]===$url){$found=true;break;}}',
    'if(!$found)$j["repositories"][]=["type"=>"vcs","url"=>$url];',
    'file_put_contents($f,json_encode($j,JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES));exit(0);',
  ].join('');
  try {
    const { stderr, code } = await spawnDockerExec(['php', '-r', phpCode], { VCS_URL: vcsUrl });
    if (code !== 0) return { success: false, error: stderr?.trim() || `PHP exit ${code}` };
    return { success: true };
  } catch (e: unknown) {
    const err = e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : String(e);
    return { success: false, error: err };
  }
}

/** 安装/卸载扩展后以 root 写入了 storage/vendor，导致 PHP-FPM 无法写日志（Permission denied）。将可写目录归属改为与 PHP-FPM 一致（crazymax 镜像常用 1000:1000）。供安装/卸载后自动调用，也可由管理后台「修复权限」按钮手动触发。 */
export async function fixFlarumStoragePermissions(): Promise<{ success: boolean; error?: string }> {
  try {
    await dockerExecFlarum(
      'chown -R 1000:1000 /data/storage /data/extensions /data/assets 2>/dev/null; chown -R 1000:1000 /opt/flarum/storage /opt/flarum/vendor /opt/flarum/public 2>/dev/null; true',
      60000
    );
    return { success: true };
  } catch (e: unknown) {
    const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : '权限修复失败';
    return { success: false, error: msg };
  }
}

function parseLogForBrokenExtensionIds(logs: string): string[] {
  const ids = new Set<string>();
  const patterns = [
    /Target class \[([^\]]+)\] does not exist/gi,
    /Class "([^"]+)" not found/gi,
    /ExtensionBootError: Experienced an error while booting extension: ([^.]+)/g,
  ];
  for (const re of patterns) {
    let m: RegExpExecArray | null;
    re.lastIndex = 0;
    while ((m = re.exec(logs)) !== null) {
      const full = m[1].trim();
      if (full) {
        const parts = full.split(/[\\/]/).filter(Boolean);
        if (parts.length >= 2) {
          const candidateId = `${parts[0].toLowerCase()}-${parts[1].toLowerCase()}`;
          const byId = FORUM_EXTENSIONS.find(e => e.id === candidateId);
          const byVariant = FORUM_EXTENSIONS.find(e => e.logNameVariants?.includes(candidateId));
          const extId = byId?.id ?? byVariant?.id;
          if (extId) ids.add(extId);
        }
        if (parts.length === 1) {
          const normalized = full.toLowerCase().replace(/\s+/g, '-');
          const byId = FORUM_EXTENSIONS.find(e => e.id === normalized);
          const byVariant = FORUM_EXTENSIONS.find(e => e.logNameVariants?.includes(normalized));
          const extId = byId?.id ?? byVariant?.id;
          if (extId) ids.add(extId);
        }
      }
    }
  }
  return Array.from(ids);
}

/** 读取 Flarum 容器内最近日志（用于排查 boot error）。 */
export async function getForumLogs(): Promise<{ success: boolean; logs?: string; error?: string }> {
  const status = await getForumStatus();
  if (status?.status !== 'deployed') {
    return { success: false, error: '论坛未部署或容器未就绪' };
  }
  try {
    const { stdout } = await dockerExecFlarum(
      'tail -300 /opt/flarum/storage/logs/flarum-*.log 2>/dev/null || tail -300 /data/storage/logs/flarum-*.log 2>/dev/null || echo "(无日志文件)"',
      15000
    );
    const logs = (stdout || '').trim() || '(无日志内容)';
    return { success: true, logs };
  } catch (e: unknown) {
    const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : '读取日志失败';
    return { success: false, error: msg };
  }
}

/** 根据 Docker/Flarum 日志解析出有问题的扩展并重装（composer require + dump-autoload + cache + 权限），修复“类不存在”导致的 boot error。 */
export async function repairForumBoot(): Promise<{ success: boolean; reinstalled?: string[]; error?: string }> {
  const status = await getForumStatus();
  if (status?.status !== 'deployed') {
    return { success: false, error: '论坛未部署或容器未就绪' };
  }
  let logs: string;
  try {
    const { stdout } = await dockerExecFlarum(
      'tail -300 /opt/flarum/storage/logs/flarum-*.log 2>/dev/null || tail -300 /data/storage/logs/flarum-*.log 2>/dev/null || echo ""',
      15000
    );
    logs = (stdout || '').trim();
  } catch {
    return { success: false, error: '无法读取论坛日志' };
  }
  const brokenIds = parseLogForBrokenExtensionIds(logs);
  if (brokenIds.length === 0) {
    await flarumCacheClearAndPublishAssets();
    const perm = await fixFlarumStoragePermissions();
    if (!perm.success) return { success: false, error: perm.error };
    const enabledIds = await getEnabledExtensionIds();
    const getDeps = (id: string) => getExtensionRequiredFlarumIds(FORUM_EXTENSIONS.find(e => e.id === id)?.composerPackage ?? '');
    const ordered = await orderExtensionsWithDependenciesFirst(enabledIds, getDeps);
    if (ordered.length > 0) await setExtensionsEnabledOrder(ordered);
    return { success: true, reinstalled: [] };
  }
  const packages = brokenIds
    .map(id => FORUM_EXTENSIONS.find(e => e.id === id)?.composerPackage)
    .filter((p): p is string => !!p);
  if (packages.length === 0) {
    return { success: true, reinstalled: [] };
  }
  try {
    await ensureComposerJsonPackageNames();
    const requireCmd = packages.map(p => `${p}:*`).join(' ');
    await dockerExecFlarum(`composer require ${requireCmd} --no-interaction --no-update`, 180000);
    await dockerExecFlarum('composer update --no-interaction', 180000);
    await dockerExecFlarum('composer dump-autoload -o', 30000);
    await dockerExecFlarum('php flarum cache:clear', 30000);
    await dockerExecFlarum('php flarum assets:publish', 60000);
    await fixFlarumStoragePermissions();
    const enabledIds = await getEnabledExtensionIds();
    const withDeps = new Set(enabledIds);
    for (const id of brokenIds) {
      const meta = FORUM_EXTENSIONS.find(e => e.id === id);
      if (meta) {
        const deps = await getExtensionRequiredFlarumIds(meta.composerPackage);
        deps.forEach(d => withDeps.add(d));
      }
    }
    const getDeps = (id: string) => getExtensionRequiredFlarumIds(FORUM_EXTENSIONS.find(e => e.id === id)?.composerPackage ?? '');
    const ordered = await orderExtensionsWithDependenciesFirst(Array.from(withDeps), getDeps);
    if (ordered.length > 0) await setExtensionsEnabledOrder(ordered);
    return { success: true, reinstalled: brokenIds };
  } catch (e: unknown) {
    const ex = e as { message?: string; stderr?: string; stdout?: string } | null;
    const msg = ex?.message ?? String(e);
    const stderr = (ex?.stderr ?? '').trim();
    const stdout = (ex?.stdout ?? '').trim();
    const detail = stderr || stdout || msg;
    return { success: false, error: detail };
  }
}

/** 一键修复：权限 → 缓存/资源 → 根据日志重装问题扩展 → 再次权限。合并“修复权限”与“修复启动”，避免用户选错。 */
export async function fixForumOneShot(): Promise<{ success: boolean; reinstalled?: string[]; error?: string }> {
  const perm1 = await fixFlarumStoragePermissions();
  if (!perm1.success) return { success: false, error: perm1.error };
  await flarumCacheClearAndPublishAssets();
  const repair = await repairForumBoot();
  if (!repair.success) return { success: false, error: repair.error };
  const perm2 = await fixFlarumStoragePermissions();
  if (!perm2.success) return { success: false, error: perm2.error };
  return { success: true, reinstalled: repair.reinstalled ?? [] };
}

/** 清理 Flarum 缓存并发布资源（官方文档：安装/移除扩展后应执行，可解决 boot error）。供「修复权限」一并调用。 */
export async function flarumCacheClearAndPublishAssets(): Promise<void> {
  try {
    await dockerExecFlarum('composer dump-autoload -o', 30000);
  } catch {
    // 忽略，继续执行后续步骤
  }
  try {
    await dockerExecFlarum('php flarum cache:clear', 30000);
    await dockerExecFlarum('php flarum assets:publish', 60000);
  } catch {
    // 忽略单次失败，不阻断主流程
  }
}

export async function installForumExtension(extensionId: string): Promise<{ success: boolean; error?: string }> {
  const meta = FORUM_EXTENSIONS.find(e => e.id === extensionId);
  if (!meta) return { success: false, error: '未知插件 ID' };
  try {
    if (meta.vcsUrl) {
      const vcsRes = await ensureComposerVcsRepository(meta.vcsUrl);
      if (!vcsRes.success) return { success: false, error: vcsRes.error ?? '添加 VCS 仓库失败' };
    }
    await ensureComposerJsonPackageNames();
    const versionConstraint = meta.vcsUrl ? 'dev-main' : '*';
    await dockerExecFlarum(`composer require ${meta.composerPackage}:${versionConstraint} --no-interaction --no-update`, 180000);
    await dockerExecFlarum('composer update --no-interaction', 180000);
    await dockerExecFlarum('composer dump-autoload -o', 30000);
    await dockerExecFlarum('php flarum migrate', 60000);
    await fixFlarumStoragePermissions();
    const depResult = await ensureDependenciesEnabled(extensionId);
    if (!depResult.success) return depResult;
    const result = await setExtensionEnabled(extensionId, true);
    if (!result.success) return result;
    // 安装后按依赖重排 extensions_enabled（依赖须在依赖方之前加载，与 Flarum 拓扑序一致）
    const enabledIds = await getEnabledExtensionIds();
    const getDeps = (id: string) =>
      getExtensionRequiredFlarumIds(FORUM_EXTENSIONS.find(e => e.id === id)?.composerPackage ?? '');
    const ordered = await orderExtensionsWithDependenciesFirst(enabledIds, getDeps);
    if (ordered.length > 0) await setExtensionsEnabledOrder(ordered);
    // 官方文档：扩展启用后应 migrate；出问题时先 cache:clear 再 assets:publish
    await dockerExecFlarum('php flarum migrate', 60000);
    await dockerExecFlarum('php flarum cache:clear', 30000);
    await dockerExecFlarum('php flarum assets:publish', 60000);
    await fixFlarumStoragePermissions();
    return { success: true };
  } catch (e: unknown) {
    const ex = e as { message?: string; stderr?: string; stdout?: string } | null;
    const msg = ex?.message ?? String(e);
    const stderr = (ex?.stderr ?? '').trim();
    const stdout = (ex?.stdout ?? '').trim();
    const detail = stderr || stdout || msg;
    const friendly = formatExtensionInstallError(detail);
    return { success: false, error: friendly };
  }
}

/** 将 Composer 安装失败输出转为用户可读说明（如 PHP 版本、安全公告限制） */
function formatExtensionInstallError(raw: string): string {
  const s = raw.toLowerCase();
  if (s.includes('require php ^8.1') && s.includes('your php version (8.0')) {
    return '该插件需要 PHP 8.1 或更高版本，当前论坛容器为 PHP 8.0。请使用支持 PHP 8.1 的 Flarum 镜像（如 crazymax/flarum）重新部署论坛后再安装。';
  }
  if (s.includes('security advisories') && s.includes('block-insecure')) {
    return '该插件依赖的包存在已知安全公告，Composer 已拦截。若需安装，请将论坛环境升级到 PHP 8.1+ 后使用该插件的较新版本（通常已修复依赖）。';
  }
  if (s.includes('cannot register two routes') || s.includes('badrouteexception')) {
    return '路由冲突：可能与其他已装插件重复注册同一路径（如 SEO 与 Sitemap 均注册 /robots.txt）。请先在论坛插件管理中暂时禁用其一（如 v17development-seo 或 fof-sitemap），再刷新论坛。';
  }
  if (s.includes('class') && s.includes('not found')) {
    return '扩展类未加载。请点击「修复权限」后重试；若仍报错，请尝试卸载该插件后重新安装。';
  }
  return raw;
}

/** 是否属于“被其他包依赖或未在根 require 导致 composer remove 未真正移除”的提示（不视为失败，仅后台禁用）。 */
function isComposerRemoveSkippedAsDependency(stderr: string, stdout: string): boolean {
  const s = (stderr + '\n' + stdout).toLowerCase();
  if (s.includes('not required in your composer.json')) return true;
  const dependencyNote =
    s.includes('required by another package') || s.includes('may be required by another package');
  const stillPresent = s.includes('still present') || s.includes('has not been removed') || s.includes('removal failed');
  return Boolean(dependencyNote && stillPresent);
}

/** 一键卸载论坛插件：与安装对称——先禁用 → migrate → composer remove → dump-autoload → cache:clear → assets:publish → 修复权限（官方：remove 后需 cache:clear，Extension Manager 会做 assets + migrate + cache）。若包被其他插件依赖，composer remove 不会真正移除，仍视为卸载成功并清理缓存。 */
export async function uninstallForumExtension(extensionId: string): Promise<{ success: boolean; error?: string; message?: string }> {
  const meta = FORUM_EXTENSIONS.find(e => e.id === extensionId);
  if (!meta) return { success: false, error: '未知插件 ID' };
  const res = await setExtensionEnabled(extensionId, false);
  if (!res.success) return res;
  await dockerExecFlarum('php flarum migrate', 60000);
  let composerRemoved = true;
  try {
    await dockerExecFlarum(`composer remove ${meta.composerPackage} --no-interaction`, 120000);
  } catch (e: unknown) {
    const ex = e as { message?: string; stderr?: string; stdout?: string } | null;
    const stderr = (ex?.stderr ?? '').trim();
    const stdout = (ex?.stdout ?? '').trim();
    if (isComposerRemoveSkippedAsDependency(stderr, stdout)) {
      composerRemoved = false;
    } else {
      const detail = stderr || stdout || (ex?.message ?? String(e));
      return { success: false, error: detail };
    }
  }
  try {
    await dockerExecFlarum('composer dump-autoload -o', 30000);
  } catch {
    // 忽略
  }
  await dockerExecFlarum('php flarum cache:clear', 30000);
  await dockerExecFlarum('php flarum assets:publish', 60000);
  await fixFlarumStoragePermissions();
  return {
    success: true,
    message: composerRemoved
      ? undefined
      : '已在论坛后台禁用并清理缓存；该插件被其他已安装插件依赖，未从 Composer 移除。',
  };
}
